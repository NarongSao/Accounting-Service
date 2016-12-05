import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';

// Method

import {lookupProduct} from '../../common/methods/lookup-product.js';
import {MakeSchedule} from '../../common/methods/make-schedule.js';

import {checkSavingTransaction} from '../../common/methods/check-saving-transaction.js';

// Before insert
Repayment.before.insert(function (userId, doc) {
    let prefix = doc.loanAccId + '-';
    doc._id = idGenerator2.genWithPrefix(Repayment, {
        prefix: prefix,
        length: 6
    });
});

// After insert
Repayment.after.insert(function (userId, doc) {
    console.log(doc);
    Meteor.defer(function () {

        /*if (doc.detailDoc) {

         if (doc.detailDoc.schedulePaid) {
         let schedulePaid = doc.detailDoc.schedulePaid;

         _.forEach(schedulePaid, (o) => {
         o.repaymentId = doc._id;

         RepaymentSchedule.update({_id: o.scheduleId}, {
         $inc: {
         'repaymentDoc.totalPrincipalPaid': o.principalPaid,
         'repaymentDoc.totalInterestPaid': o.interestPaid,
         'repaymentDoc.totalPenaltyPaid': o.penaltyPaid,
         'repaymentDoc.totalInterestWaived': o.interestWaived,
         },
         $push: {'repaymentDoc.detail': o}
         });
         });
         }
         }*/

        let loanAcc = LoanAcc.findOne({_id: doc.loanAccId});
        //Saving Link
        if (["General", "Close"].includes(doc.type) == true) {


            // Update schedule
            if (doc.detailDoc) {

                if (doc.detailDoc.schedulePaid) {
                    let schedulePaid = doc.detailDoc.schedulePaid;

                    _.forEach(schedulePaid, (o) => {
                        let updatePay = {};
                        if (o.totalPrincipalInterestBal == 0) {
                            updatePay.isPay = true;
                            updatePay.isFullPay = true;
                        } else {
                            updatePay.isPay = true;
                            updatePay.isFullPay = false;
                        }

                        o.repaymentId = doc._id;

                        RepaymentSchedule.update({_id: o.scheduleId}, {
                            $inc: {
                                'repaymentDoc.totalPrincipalPaid': o.principalPaid,
                                'repaymentDoc.totalInterestPaid': o.interestPaid,
                                'repaymentDoc.totalPenaltyPaid': o.penaltyPaid,
                                'repaymentDoc.totalInterestWaived': o.interestWaived,
                            },
                            $push: {'repaymentDoc.detail': o},
                            $set: updatePay
                        });
                    });
                }
            }

            // Insert Data to Saving
            if (loanAcc.savingAccId) {

                let savingLoanDeposit = {};
                let savingLoanWithdrawal = {};

                savingLoanDeposit.paymentId = doc._id;
                savingLoanWithdrawal.paymentId = doc._id;

                // Deposit
                let savingDeposit = checkSavingTransaction.run({
                    savingAccId: loanAcc.savingAccId,
                    checkDate: doc.repaidDate
                });


                if (savingDeposit) {
                    savingLoanDeposit.branchId = doc.branchId;
                    savingLoanDeposit.amount = doc.amountPaid;
                    savingLoanDeposit.savingAccId = loanAcc.savingAccId;
                    savingLoanDeposit.transactionDate = doc.repaidDate;
                    savingLoanDeposit.voucherId = doc.voucherId;
                    savingLoanDeposit.memo = doc.note;
                    savingLoanDeposit.currencyId = doc.currencyId;


                    savingDeposit.principalBal = new BigNumber(savingDeposit.principalOpening).plus(doc.amountPaid).toNumber();

                    // Remove last transaction
                    delete savingDeposit.lastTransaction;

                    savingLoanDeposit.transactionType = 'LD';
                    savingLoanDeposit.details = savingDeposit;

                    SavingTransaction.insert(savingLoanDeposit);
                }


                //Withdrawal
                let savingWithdrawal = checkSavingTransaction.run({
                    savingAccId: loanAcc.savingAccId,
                    checkDate: doc.repaidDate
                })

                if (savingWithdrawal) {
                    savingLoanWithdrawal.branchId = doc.branchId;
                    savingLoanWithdrawal.savingAccId = loanAcc.savingAccId;
                    savingLoanWithdrawal.transactionDate = doc.repaidDate;
                    savingLoanWithdrawal.voucherId = doc.voucherId;
                    savingLoanWithdrawal.memo = doc.note;
                    savingLoanWithdrawal.currencyId = doc.currencyId;


                    if (doc.type == "General") {
                        savingLoanWithdrawal.amount = doc.detailDoc.totalSchedulePaid.totalAmountPaid ? doc.detailDoc.totalSchedulePaid.totalAmountPaid : 0;
                    } else if (doc.type = "Close") {
                        savingLoanWithdrawal.amount = doc.detailDoc.closing.totalDue ? doc.detailDoc.closing.totalDue : 0;
                    }

                    // Cal principal, interest bal
                    let amount = new BigNumber(savingLoanWithdrawal.amount);
                    if (amount.lessThanOrEqualTo(savingWithdrawal.interestBal)) {
                        savingWithdrawal.interestBal = new BigNumber(savingWithdrawal.interestBal).minus(amount).toNumber();
                        savingWithdrawal.principalBal = new BigNumber(savingWithdrawal.principalOpening).toNumber();
                    } else {
                        amount = amount.minus(savingWithdrawal.interestBal);
                        savingWithdrawal.interestBal = new BigNumber(0).toNumber();
                        savingWithdrawal.principalBal = new BigNumber(savingWithdrawal.principalOpening).minus(amount).toNumber();
                    }

                    // Remove last transaction
                    delete savingWithdrawal.lastTransaction;

                    savingLoanWithdrawal.transactionType = 'LR';
                    savingLoanWithdrawal.details = savingWithdrawal;

                    SavingTransaction.insert(savingLoanWithdrawal);
                }
            }
        }
        else if (doc.type == "Prepay") {
            // Update schedule
            if (doc.detailDoc) {
                if (doc.detailDoc.schedulePaid) {
                    let schedulePaid = doc.detailDoc.schedulePaid;


                    _.forEach(schedulePaid, (o) => {

                        let updatePay = {};
                        if (o.totalPrincipalInterestBal == 0) {
                            updatePay.isPay = true;
                            updatePay.isFullPay = true;
                        } else {
                            updatePay.isPay = true;
                            updatePay.isFullPay = false;
                        }

                        updatePay.isPrePay = true;

                        RepaymentSchedule.update({_id: o.scheduleId}, {
                            $set: updatePay
                        });
                    });
                }
                if (loanAcc.savingAccId) {
                    let savingLoanDeposit = {};
                    savingLoanDeposit.paymentId = doc._id;

                    // Deposit
                    let savingDeposit = checkSavingTransaction.run({
                        savingAccId: loanAcc.savingAccId,
                        checkDate: doc.repaidDate
                    });


                    if (savingDeposit) {
                        savingLoanDeposit.branchId = doc.branchId;
                        savingLoanDeposit.amount = doc.amountPaid;
                        savingLoanDeposit.savingAccId = loanAcc.savingAccId;
                        savingLoanDeposit.transactionDate = doc.repaidDate;
                        savingLoanDeposit.voucherId = doc.voucherId;
                        savingLoanDeposit.memo = doc.note;
                        savingLoanDeposit.currencyId = doc.currencyId;


                        savingDeposit.principalBal = new BigNumber(savingDeposit.principalOpening).plus(doc.amountPaid).toNumber();

                        // Remove last transaction
                        delete savingDeposit.lastTransaction;

                        savingLoanDeposit.transactionType = 'LD';
                        savingLoanDeposit.details = savingDeposit;

                        SavingTransaction.insert(savingLoanDeposit);
                    }
                }

            }
        } else if (["Reschedule", "Write Off"].includes(doc.type) == true) {

            if (doc.type == "Reschedule") {
                doc.savingAccId = loanAcc.savingAccId;
                _makeScheduleForPrincipalInstallment(doc);
            }


            // Insert Data to Saving
            if (loanAcc.savingAccId) {

                let savingLoanDeposit = {};
                let savingLoanWithdrawal = {};

                savingLoanDeposit.paymentId = doc._id;
                savingLoanWithdrawal.paymentId = doc._id;

                // Deposit
                let savingDeposit = checkSavingTransaction.run({
                    savingAccId: loanAcc.savingAccId,
                    checkDate: doc.repaidDate
                });


                if (savingDeposit) {
                    savingLoanDeposit.branchId = doc.branchId;
                    savingLoanDeposit.amount = doc.amountPaid;
                    savingLoanDeposit.savingAccId = loanAcc.savingAccId;
                    savingLoanDeposit.transactionDate = doc.repaidDate;
                    savingLoanDeposit.voucherId = doc.voucherId;
                    savingLoanDeposit.memo = doc.note;
                    savingLoanDeposit.currencyId = doc.currencyId;


                    savingDeposit.principalBal = new BigNumber(savingDeposit.principalOpening).plus(doc.amountPaid).toNumber();

                    // Remove last transaction
                    delete savingDeposit.lastTransaction;

                    savingLoanDeposit.transactionType = 'LD';
                    savingLoanDeposit.details = savingDeposit;

                    SavingTransaction.insert(savingLoanDeposit);
                }


                //Withdrawal
                let savingWithdrawal = checkSavingTransaction.run({
                    savingAccId: loanAcc.savingAccId,
                    checkDate: doc.repaidDate
                })

                if (savingWithdrawal) {
                    savingLoanWithdrawal.branchId = doc.branchId;
                    savingLoanWithdrawal.savingAccId = loanAcc.savingAccId;
                    savingLoanWithdrawal.transactionDate = doc.repaidDate;
                    savingLoanWithdrawal.voucherId = doc.voucherId;
                    savingLoanWithdrawal.memo = doc.note;
                    savingLoanWithdrawal.currencyId = doc.currencyId;


                    savingLoanWithdrawal.amount = doc.amountPaid;


                    // Cal principal, interest bal
                    let amount = new BigNumber(savingLoanWithdrawal.amount);
                    if (amount.lessThanOrEqualTo(savingWithdrawal.interestBal)) {
                        savingWithdrawal.interestBal = new BigNumber(savingWithdrawal.interestBal).minus(amount).toNumber();
                        savingWithdrawal.principalBal = new BigNumber(savingWithdrawal.principalOpening).toNumber();
                    } else {
                        amount = amount.minus(savingWithdrawal.interestBal);
                        savingWithdrawal.interestBal = new BigNumber(0).toNumber();
                        savingWithdrawal.principalBal = new BigNumber(savingWithdrawal.principalOpening).minus(amount).toNumber();
                    }

                    // Remove last transaction
                    delete savingWithdrawal.lastTransaction;

                    savingLoanWithdrawal.transactionType = 'LR';
                    savingLoanWithdrawal.details = savingWithdrawal;

                    SavingTransaction.insert(savingLoanWithdrawal);
                }
            }
        }

        //End Saving Link


        // Update loan acc for close type
        if (doc.type == 'Close') {
            // Set close status on loan acc
            LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {closeDate: doc.repaidDate, status: "Close"}});
        }


        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: 1}});


    });
});


// After remove
Repayment.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        // Update schedule
        /*// Update schedule
         if (doc.detailDoc) {
         if (doc.detailDoc.schedulePaid) {
         let schedulePaid = doc.detailDoc.schedulePaid;

         _.forEach(schedulePaid, (o) => {
         RepaymentSchedule.update({_id: o.scheduleId}, {
         $inc: {
         'repaymentDoc.totalPrincipalPaid': -o.principalPaid,
         'repaymentDoc.totalInterestPaid': -o.interestPaid,
         'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
         'repaymentDoc.totalInterestWaived': -o.interestWaived,
         },
         $pull: {'repaymentDoc.detail': {repaymentId: doc._id}}
         });
         });
         }
         }*/

        let loanAcc = LoanAcc.findOne({_id: doc.loanAccId});

        //Saving Link

        if (["General", "Close"].includes(doc.type) == true) {

            // Update schedule
            if (doc.detailDoc) {
                if (doc.detailDoc.schedulePaid) {
                    let schedulePaid = doc.detailDoc.schedulePaid;

                    _.forEach(schedulePaid, (o) => {


                        RepaymentSchedule.update({_id: o.scheduleId}, {
                            $inc: {
                                'repaymentDoc.totalPrincipalPaid': -o.principalPaid,
                                'repaymentDoc.totalInterestPaid': -o.interestPaid,
                                'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
                                'repaymentDoc.totalInterestWaived': -o.interestWaived,
                            },
                            $pull: {'repaymentDoc.detail': {repaymentId: doc._id}},
                            $set: {isPay: false, isFullPay: false}
                        });
                    });
                }
            }

            SavingTransaction.remove({paymentId: doc._id});
        } else if (doc.type == "Prepay") {
            if (doc.detailDoc) {
                if (doc.detailDoc.schedulePaid) {
                    let schedulePaid = doc.detailDoc.schedulePaid;

                    _.forEach(schedulePaid, (o) => {

                        RepaymentSchedule.update({_id: o.scheduleId}, {
                            $set: {isPay: false, isFullPay: false, isPrePay: false}
                        });
                    });
                }
            }
            SavingTransaction.remove({paymentId: doc._id});
        } else if (["Reschedule", "Write Off"].includes(doc.type) == true) {

            if (doc.type == "Reschedule") {
                RepaymentSchedule.remove({scheduleDate: doc.repaidDate, loanAccId: doc.loanAccId});
            }

            SavingTransaction.remove({paymentId: doc._id});
        }
        //End Saving Link


        // Update loan acc for close type
        if (doc.type == 'Close') {
            // Set close status on loan acc
            LoanAcc.direct.update({_id: doc.loanAccId}, {$unset: {closeDate: ''}});

            if (loanAcc.writeOffDate != undefined) {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: 'Write Off'}});
            } else if (loanAcc.restructureDate != undefined) {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: 'Restructure'}});
            } else {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: "Active"}});
            }
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: -1}});


    });

});


// Create repayment schedule when principal installment
function _makeScheduleForPrincipalInstallment(doc) {

    let amount = doc.detailDoc.principalInstallment.principalReminder;
    let options = {};
    options.disbursementDate = doc.repaidDate;
    options.loanAmount = amount - doc.amountPaid;
    options.term = doc.detailDoc.scheduleNext.length;
    options.firstRepaymentDate = null;

    let i = 0;
    doc.detailDoc.scheduleNext.forEach(function (obj) {
        if (obj.allowClosing == true) {
            i++;
        }
    })
    options.installmentAllowClosing = options.term + 1 - i;

    let schedule = MakeSchedule.declinig.call({loanAccId: doc.loanAccId, options: options});

    let maturityDate, tenor = 0;

    _.forEach(schedule, (value, key) => {
        tenor += value.numOfDay;
        if (key == schedule.length - 1) {
            maturityDate = value.dueDate;
        }

        // Save to repayment schedule collection
        value.scheduleDate = doc.repaidDate;
        value.loanAccId = doc.loanAccId;
        value.savingAccId = doc.savingAccId;
        value.branchId = doc.branchId;
        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on loan acc
    LoanAcc.direct.update({_id: doc._id}, {$set: {maturityDate: maturityDate, tenor: tenor}});
}