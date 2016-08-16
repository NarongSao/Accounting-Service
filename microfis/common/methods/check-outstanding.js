import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';
import BigNumber from 'bignumber.js';
import {round2} from 'meteor/theara:round2';

// Lib
import {roundCurrency} from '../../imports/api/libs/round-currency.js';

// Method
import {Calculate} from './libs/calculate.js';
import {lookupLoanAcc} from './lookup-loan-acc.js';

// Collection
import {LoanAcc} from '../../imports/api/collections/loan-acc';
import {RepaymentSchedule} from '../../imports/api/collections/repayment-schedule.js';

export let checkOutstanding = new ValidatedMethod({
    name: 'microfis.checkOutstanding',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        schedule: {
            type: Array,
            min: 1
        },
        'schedule.$': {
            type: Object,
            blackbox: true
        },
        checkDate: {
            type: Date
        },
        opts: {
            type: Object
        },
        'opts.penalty': {
            type: Object,
            blackbox: true
        },
        'opts.currencyId': {
            type: String
        },
    }).validator(),
    run({schedule, checkDate, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Check currency
            let round = {
                type: 'general'
            };
            switch (opts.currencyId) {
                case 'KHR':
                    round.precision = -2;
                    break;
                case 'USD':
                    round.precision = 2;
                    break;
                case 'THB':
                    round.precision = 0;
                    break;
            }

            // Loop schedule
            let scheduleDue = [],
                schedulePrevious = [],
                scheduleNext = [];

            _.forEach(schedule, (o)=> {
                let checker = {};

                // Check due date
                checker.dueDateIsSameOrBeforeCheckDate = moment(o.dueDate).isSameOrBefore(checkDate, 'day');
                if (checker.dueDateIsSameOrBeforeCheckDate) {
                    let principalDue = o.principalDue,
                        interestDue = o.interestDue;

                    // Check detail on repayment doc exist
                    checker.detailOnRepaymentDocExist = o.repaymentDoc && o.repaymentDoc.detail.length > 0;
                    if (checker.detailOnRepaymentDocExist) {
                        let repaidOnDetailOfRepaymentDocIsSameOrBeforeCheckDate = _.filter(o.repaymentDoc.detail, (repaidDocObj) => {
                                return moment(repaidDocObj.repaidDate).isSameOrBefore(checkDate, 'day');
                            }
                        );

                        // Check repaid detail exist
                        if (repaidOnDetailOfRepaymentDocIsSameOrBeforeCheckDate.length > 0) {
                            let maxRepaidOnDetail = _.maxBy(repaidOnDetailOfRepaymentDocIsSameOrBeforeCheckDate, function (obj) {
                                return obj.repaymentId;
                            });

                            // Set max repaid value
                            o.repaymentDoc.detail = repaidOnDetailOfRepaymentDocIsSameOrBeforeCheckDate;
                            principalDue = maxRepaidOnDetail.principalBal;
                            interestDue = maxRepaidOnDetail.interestBal;

                        }
                    } // detail on repayment doc don't exist

                    // Check total principal, interest due
                    let totalPrincipalInterestDue = round2(principalDue + interestDue, round.precision, round.type);
                    if (totalPrincipalInterestDue > 0) {
                        let numOfDayLate, penaltyDue = 0;

                        // Cal penalty
                        numOfDayLate = moment(checkDate).startOf('day').diff(moment(o.dueDate).startOf('day'), 'days');
                        if (numOfDayLate > opts.penalty.graceDay) {
                            // Check penalty type
                            penaltyDue = opts.penalty.amount;

                            if (opts.penalty.calculateType == 'P') {
                                penaltyDue = Calculate.interest.call({
                                    amount: totalPrincipalInterestDue,
                                    numOfDay: numOfDayLate,
                                    interestRate: opts.penalty.amount,
                                    method: 'D',
                                    currencyId: opts.currencyId
                                });
                            }
                        }

                        // Set current due
                        let totalAmountDue = round2(totalPrincipalInterestDue + penaltyDue, round.precision, round.type);

                        o.currentDue = {
                            numOfDayLate: numOfDayLate,
                            principal: principalDue,
                            interest: interestDue,
                            totalPrincipalInterest: totalPrincipalInterestDue,
                            penalty: penaltyDue,
                            totalAmount: totalAmountDue
                        };

                        scheduleDue.push(o);

                    } else { // total due = 0
                        schedulePrevious.push(o);
                    }

                } else {
                    scheduleNext.push(o);
                }
            });

            // Total schedule due
            let totalScheduleDue = _.reduce(scheduleDue, (result, val, key)=> {
                // Head
                if (key == 0) {
                    result.installment.from = val.installment;
                    result.dueDate.from = val.dueDate;
                    result.numOfDayLate = val.currentDue.numOfDayLate;
                }
                // Last
                if (key == (scheduleDue.length - 1)) {
                    result.installment.to = val.installment;
                    result.dueDate.to = val.dueDate;
                }

                result.principalDue = round2(result.principalDue + val.currentDue.principal, round.precision, round.type);
                result.interestDue = round2(result.interestDue + val.currentDue.interest, round.precision, round.type);
                result.totalPrincipalInterestDue = round2(result.totalPrincipalInterestDue + val.currentDue.totalPrincipalInterest, round.precision, round.type);
                result.penaltyDue = round2(result.penaltyDue + val.currentDue.penalty, round.precision, round.type);
                result.totalAmountDue = round2(result.totalAmountDue + val.currentDue.totalAmount, round.precision, round.type);

                return result;
            }, {
                installment: {
                    from: null,
                    to: null
                },
                dueDate: {
                    from: null,
                    to: null
                },
                numOfDayLate: null,
                principalDue: 0,
                interestDue: 0,
                totalPrincipalInterestDue: 0,
                penaltyDue: 0,
                totalAmountDue: 0
            });

            // Total schedule previous
            let totalSchedulePrevious = _.reduce(schedulePrevious, (result, val, key)=> {
                // Head
                if (key == 0) {
                    result.installment.from = val.installment;
                    result.dueDate.from = val.dueDate;
                }
                // Last
                if (key == (schedulePrevious.length - 1)) {
                    result.installment.to = val.installment;
                    result.dueDate.to = val.dueDate;

                    // Cal num of day
                    result.numOfDayLate = moment(checkDate).startOf('day').diff(val.dueDate, 'days');
                }

                result.principalDue = round2(result.principalDue + val.principalDue, round.precision, round.type);
                result.interestDue = round2(result.interestDue + val.interestDue, round.precision, round.type);
                result.totalPrincipalInterestDue = round2(result.principalDue + val.interestDue, round.precision, round.type);
                result.totalAmountDue = round2(result.totalPrincipalInterestDue + result.penaltyDue, round.precision, round.type);

                return result;
            }, {
                installment: {
                    from: null,
                    to: null
                },
                dueDate: {
                    from: null,
                    to: null
                },
                numOfDayLate: null,
                principalDue: 0,
                interestDue: 0,
                totalPrincipalInterestDue: 0,
                penaltyDue: 0,
                totalAmountDue: 0
            });

            // Total schedule next
            let totalScheduleNext = _.reduce(scheduleNext, (result, val, key)=> {
                // Head
                if (key == 0) {
                    result.installment.from = val.installment;
                    result.dueDate.from = val.dueDate;

                    // Cal num of day
                    result.numOfDayLate = moment(checkDate).startOf('day').diff(moment(val.dueDate).startOf('day'), 'days');
                }
                // Last
                if (key == (scheduleNext.length - 1)) {
                    result.installment.to = val.installment;
                    result.dueDate.to = val.dueDate;
                }

                result.principalDue = round2(result.principalDue + val.principalDue, round.precision, round.type);
                result.interestDue = round2(result.interestDue + val.interestDue, round.precision, round.type);
                result.totalPrincipalInterestDue = round2(result.principalDue + val.interestDue, round.precision, round.type);
                result.totalAmountDue = round2(result.totalPrincipalInterestDue + result.penaltyDue, round.precision, round.type);

                return result;
            }, {
                installment: {
                    from: null,
                    to: null
                },
                dueDate: {
                    from: null,
                    to: null
                },
                numOfDayLate: null,
                principalDue: 0,
                interestDue: 0,
                totalPrincipalInterestDue: 0,
                penaltyDue: 0,
                totalAmountDue: 0
            });

            return {
                scheduleDue: scheduleDue,
                totalScheduleDue: totalScheduleDue,
                schedulePrevious: schedulePrevious,
                totalSchedulePrevious: totalSchedulePrevious,
                scheduleNext: scheduleNext,
                totalScheduleNext: totalScheduleNext
            };
        }
    }
});
