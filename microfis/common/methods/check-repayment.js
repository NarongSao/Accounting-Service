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

export let checkRepayment = new ValidatedMethod({
    name: 'microfis.checkRepayment',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {
            type: String
        },
        checkDate: {
            type: Date
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        },
    }).validator(),
    run({loanAccId, checkDate, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Get loan acc and schedule
            let loanAccDoc = lookupLoanAcc.call({_id: loanAccId}),
                scheduleDoc = RepaymentSchedule.find({loanAccId: loanAccId}),
                penaltyDoc = loanAccDoc.productDoc.penaltyDoc,
                penaltyClosingDoc = loanAccDoc.productDoc.penaltyClosingDoc;

            //---------------------------

            // Check currency
            let _round = {
                type: 'general',
                precision: -2 // KHR
            };
            switch (loanAccDoc.currencyId) {
                case 'USD':
                    _round.precision = 2;
                    break;
                case 'THB':
                    _round.precision = 0;
                    break;
            }

            // Loop schedule
            let scheduleDue = [],
                schedulePrevious = [],
                scheduleNext = [];

            scheduleDoc.forEach((o)=> {
                let checker = {};

                let principalDue = o.principalDue,
                    interestDue = o.interestDue,
                    totalPrincipalInterestDue = o.totalDue;

                // Check detail on repayment doc exist
                checker.detailOnRepaymentDocExist = o.repaymentDoc && o.repaymentDoc.detail.length > 0;
                if (checker.detailOnRepaymentDocExist) {
                    let detailOnRepaymentDoc = o.repaymentDoc.detail;
                    let maxRepaidOnDetail = _.maxBy(detailOnRepaymentDoc, function (obj) {
                        return obj.repaymentId;
                    });

                    // Set max repaid value
                    principalDue = maxRepaidOnDetail.principalBal;
                    interestDue = maxRepaidOnDetail.interestBal;
                    totalPrincipalInterestDue = maxRepaidOnDetail.totalPrincipalInterestBal;

                } // detail on repayment doc don't exist

                // Check total principal & interest due
                if (totalPrincipalInterestDue > 0) {
                    let numOfDayLate, penaltyDue = 0;

                    // Cal penalty
                    numOfDayLate = moment(checkDate).startOf('day').diff(moment(o.dueDate).startOf('day'), 'days');
                    if (numOfDayLate > penaltyDoc.graceDay) {
                        // Check penalty type
                        penaltyDue = penaltyDoc.amount;

                        if (penaltyDoc.calculateType == 'P') {
                            penaltyDue = Calculate.interest.call({
                                amount: totalPrincipalInterestDue,
                                numOfDay: numOfDayLate,
                                interestRate: penaltyDoc.amount,
                                method: 'D',
                                currencyId: loanAccDoc.currencyId
                            });
                        }
                    }

                    // Set current due
                    let totalAmountDue = round2(totalPrincipalInterestDue + penaltyDue, _round.precision, _round.type);

                    o.currentDue = {
                        numOfDayLate: numOfDayLate,
                        principal: principalDue,
                        interest: interestDue,
                        totalPrincipalInterest: totalPrincipalInterestDue,
                        penalty: penaltyDue,
                        totalAmount: totalAmountDue
                    };

                    // Check due date
                    checker.dueDateIsSameOrBeforeCheckDate = moment(o.dueDate).isSameOrBefore(checkDate, 'day');
                    if (checker.dueDateIsSameOrBeforeCheckDate) {
                        scheduleDue.push(o);
                    } else {
                        scheduleNext.push(o);
                    }

                } else { // Else check total principal & interest due = 0
                    schedulePrevious.push(o);
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

                result.principalDue = round2(result.principalDue + val.currentDue.principal, _round.precision, _round.type);
                result.interestDue = round2(result.interestDue + val.currentDue.interest, _round.precision, _round.type);
                result.totalPrincipalInterestDue = round2(result.totalPrincipalInterestDue + val.currentDue.totalPrincipalInterest, _round.precision, _round.type);
                result.penaltyDue = round2(result.penaltyDue + val.currentDue.penalty, _round.precision, _round.type);
                result.totalAmountDue = round2(result.totalAmountDue + val.currentDue.totalAmount, _round.precision, _round.type);

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

                result.principalDue = round2(result.principalDue + val.principalDue, _round.precision, _round.type);
                result.interestDue = round2(result.interestDue + val.interestDue, _round.precision, _round.type);
                result.totalPrincipalInterestDue = round2(result.principalDue + val.interestDue, _round.precision, _round.type);
                result.totalAmountDue = round2(result.totalPrincipalInterestDue + result.penaltyDue, _round.precision, _round.type);

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

                result.principalDue = round2(result.principalDue + val.currentDue.principal, _round.precision, _round.type);
                result.interestDue = round2(result.interestDue + val.currentDue.interest, _round.precision, _round.type);
                result.totalPrincipalInterestDue = round2(result.totalPrincipalInterestDue + val.currentDue.totalPrincipalInterest, _round.precision, _round.type);
                result.penaltyDue = round2(result.penaltyDue + val.currentDue.penalty, _round.precision, _round.type);
                result.totalAmountDue = round2(result.totalAmountDue + val.currentDue.totalAmount, _round.precision, _round.type);

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

            /*------ Calculate closing ---------*/
            let closing = {
                principalReminder: totalScheduleNext.principalDue,
                interestReminder: totalScheduleNext.interestDue,
                numOfDayAddition: 0,
                interestAddition: 0,
                interestReminderPenalty: 0,
                interestWaived: 0,
                totalDue: 0
            };

            // Cal addition
            if (totalSchedulePrevious && totalSchedulePrevious.dueDate.to) {
                closing.numOfDayAddition = moment(checkDate).startOf('day').diff(moment(totalSchedulePrevious.dueDate.to).startOf('day'), 'days');
            }
            if (totalScheduleDue && totalScheduleDue.dueDate.to) {
                closing.numOfDayAddition = moment(checkDate).startOf('day').diff(moment(totalScheduleDue.dueDate.to).startOf('day'), 'days');
            }

            if (closing.numOfDayAddition > 0) {
                closing.interestAddition = Calculate.interest.call({
                    amount: closing.principalReminder,
                    numOfDay: closing.numOfDayAddition,
                    interestRate: loanAccDoc.interestRate,
                    method: loanAccDoc.paymentMethod,
                    currencyId: loanAccDoc.currencyId
                });

                closing.interestReminder = round2(closing.interestReminder - closing.interestAddition, _round.precision, _round.type);
            }

            // Cal interest penalty
            if (totalScheduleDue.installment.to) {
                if (totalScheduleDue.installment.to < loanAccDoc.installmentAllowClosing) {
                    console.log('hi due');
                    closing.interestReminderPenalty = round2(closing.interestReminder * penaltyClosingDoc.interestRemainderCharge / 100, _round.precision, _round.type);
                }
            } else {
                let checkInstallmentTermPrevious = totalSchedulePrevious.installment.to && totalSchedulePrevious.installment.to < loanAccDoc.installmentAllowClosing;
                if (!totalSchedulePrevious.installment.to || checkInstallmentTermPrevious) {
                    console.log('hi pre');
                    closing.interestReminderPenalty = round2(closing.interestReminder * penaltyClosingDoc.interestRemainderCharge / 100, _round.precision, _round.type);
                }
            }

            closing.interestWaived = round2(closing.interestReminder - closing.interestReminderPenalty, _round.precision, _round.type);
            closing.totalDue = round2(closing.principalReminder + closing.interestAddition + closing.interestReminderPenalty, _round.precision, _round.type);


            return {
                scheduleDue: scheduleDue,
                totalScheduleDue: totalScheduleDue,
                schedulePrevious: schedulePrevious,
                totalSchedulePrevious: totalSchedulePrevious,
                scheduleNext: scheduleNext,
                totalScheduleNext: totalScheduleNext,
                closing: closing
            };
        }
    }
});
