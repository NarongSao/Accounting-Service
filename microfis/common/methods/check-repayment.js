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
import {roundCurrency} from '../libs/round-currency';

// Method
import {Calculate} from '../libs/calculate';
import {lookupLoanAcc} from './lookup-loan-acc';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule';
import {Repayment} from '../../common/collections/repayment';

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
            let lastScheduleDateTemp = RepaymentSchedule.findOne({
                loanAccId: loanAccId,
                scheduleDate: {$lte: checkDate}
            }, {sort: {scheduleDate: -1}});

            let lastScheduleDate;

            if (lastScheduleDateTemp != undefined) {
                lastScheduleDate = lastScheduleDateTemp.scheduleDate;
            } else {
                let lastScheduleDate = RepaymentSchedule.findOne({
                    loanAccId: loanAccId,
                }, {sort: {scheduleDate: 1}}).scheduleDate;
            }

            let loanAccDoc = {};

            if (opts != undefined) {
                loanAccDoc = opts;
            } else {
                loanAccDoc = lookupLoanAcc.call({_id: loanAccId});
            }

            let scheduleDoc = RepaymentSchedule.find({loanAccId: loanAccId, scheduleDate: lastScheduleDate}),
                penaltyDoc = loanAccDoc.penaltyDoc,
                penaltyClosingDoc = loanAccDoc.penaltyClosingDoc;


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

            scheduleDoc.forEach((o) => {
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
                        }else {
                            if (loanAccDoc.currencyId == "KHR") {
                                penaltyDue = penaltyDoc.amount * numOfDayLate * loanAccDoc.productDoc.exchange.KHR;

                            } else if (loanAccDoc.currencyId == "THB") {
                                penaltyDue = penaltyDoc.amount * numOfDayLate * loanAccDoc.productDoc.exchange.THB;

                            } else {
                                penaltyDue = penaltyDoc.amount * numOfDayLate;
                            }
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
            let totalScheduleDue = _.reduce(scheduleDue, (result, val, key) => {
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
                numOfDayLate: 0,
                principalDue: 0,
                interestDue: 0,
                totalPrincipalInterestDue: 0,
                penaltyDue: 0,
                totalAmountDue: 0
            });

            // Total schedule previous
            let totalSchedulePrevious = _.reduce(schedulePrevious, (result, val, key) => {
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
                numOfDayLate: 0,
                principalDue: 0,
                interestDue: 0,
                totalPrincipalInterestDue: 0,
                penaltyDue: 0,
                totalAmountDue: 0
            });

            // Total schedule next
            let totalScheduleNext = _.reduce(scheduleNext, (result, val, key) => {
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
                numOfDayLate: 0,
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


            //check should be penalty
            let isPenalty = true;
            if (loanAccDoc.paymentMethod == "M") {
                if (moment(checkDate).format("MM/YYYY") == moment(totalScheduleNext.dueDate.from).format("MM/YYYY")) {
                    isPenalty = false;
                }
            } else if (loanAccDoc.paymentMethod == "W") {
                if (moment(checkDate).week() == moment(totalScheduleNext.dueDate.from).week()) {
                    isPenalty = false;
                }
            }

            // Cal interest penalty
            if (totalScheduleDue.installment.to) {
                if (totalScheduleDue.installment.to < loanAccDoc.installmentAllowClosing && isPenalty) {
                    closing.interestReminderPenalty = round2(closing.interestReminder * penaltyClosingDoc.interestRemainderCharge / 100, _round.precision, _round.type);
                }
            } else {
                let checkInstallmentTermPrevious = totalSchedulePrevious.installment.to && totalSchedulePrevious.installment.to < loanAccDoc.installmentAllowClosing;
                if ((!totalSchedulePrevious.installment.to || checkInstallmentTermPrevious) && isPenalty) {
                    closing.interestReminderPenalty = round2(closing.interestReminder * penaltyClosingDoc.interestRemainderCharge / 100, _round.precision, _round.type);
                }
            }

            closing.interestWaived = round2(closing.interestReminder - closing.interestReminderPenalty, _round.precision, _round.type);
            closing.totalDue = round2(closing.principalReminder + closing.interestAddition + closing.interestReminderPenalty, _round.precision, _round.type);


            /*------ Calculate Principal Installment ---------*/

            let principalInstallment = {
                principalReminder: totalScheduleNext.principalDue,
                interestReminder: totalScheduleNext.interestDue,
                numOfDayAddition: 0,
                interestAddition: 0,
                totalDue: 0
            };


            // Cal addition
            if (totalSchedulePrevious && totalSchedulePrevious.dueDate.to) {
                principalInstallment.numOfDayAddition = moment(checkDate).startOf('day').diff(moment(totalSchedulePrevious.dueDate.to).startOf('day'), 'days');
            }
            if (totalScheduleDue && totalScheduleDue.dueDate.to) {
                principalInstallment.numOfDayAddition = moment(checkDate).startOf('day').diff(moment(totalScheduleDue.dueDate.to).startOf('day'), 'days');
            }

            if (principalInstallment.numOfDayAddition > 0) {
                principalInstallment.interestAddition = Calculate.interest.call({
                    amount: principalInstallment.principalReminder,
                    numOfDay: principalInstallment.numOfDayAddition,
                    interestRate: loanAccDoc.interestRate,
                    method: loanAccDoc.paymentMethod,
                    currencyId: loanAccDoc.currencyId
                });

            }

            principalInstallment.totalDue = round2(principalInstallment.principalReminder + principalInstallment.interestAddition, _round.precision, _round.type);


            // ReSchedule
            let balanceUnPaid = 0;
            let interestUnPaid = 0;
            scheduleDoc.forEach(function (obj) {
                balanceUnPaid += obj.principalDue;
                interestUnPaid += obj.interestDue;
                if (obj.repaymentDoc) {
                    balanceUnPaid -= obj.repaymentDoc.totalPrincipalPaid;
                    interestUnPaid -= obj.repaymentDoc.totalInterestPaid;
                }
            })


            // Get last repayment
            let lastRepayment = Repayment.findOne({loanAccId: loanAccId}, {sort: {_id: -1}});

            // ------------Schedule Next Pay-----------
            let scheduleNexPay = {};
            if (scheduleNext && scheduleNext.length > 0) {
                scheduleNexPay = scheduleNext[0];
            } else {
                scheduleNexPay = {
                    installment: "-",
                    dueDate: null,
                    principalDue: 0,
                    interestDue: 0,
                    totalDue: 0
                }
            }


            return {
                scheduleDue: scheduleDue,
                totalScheduleDue: totalScheduleDue,
                schedulePrevious: schedulePrevious,
                totalSchedulePrevious: totalSchedulePrevious,
                scheduleNext: scheduleNext,
                scheduleNextPay: scheduleNexPay,
                totalScheduleNext: totalScheduleNext,
                closing: closing,
                principalInstallment: principalInstallment,
                lastRepayment: lastRepayment,
                balanceUnPaid: math.round(balanceUnPaid, 2),
                interestUnPaid: math.round(interestUnPaid, 2)
            };
        }
    }
});
