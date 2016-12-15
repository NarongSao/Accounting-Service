import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';
import {SavingAcc} from '../../common/collections/saving-acc.js';

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
    if (doc.type != "Fee") {
        Meteor.defer(function () {

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
                                updatePay.isPay = false;
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
                            },function (err) {
                                if(err){
                                    console.log(err);
                                }
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

                        SavingTransaction.insert(savingLoanDeposit,function (err) {
                            if(err){
                                console.log(err);
                            }
                        });
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
                            savingLoanWithdrawal.amount = doc.detailDoc.totalSchedulePaid.totalAmountPaid <= savingWithdrawal.principalOpening ? doc.detailDoc.totalSchedulePaid.totalAmountPaid : savingWithdrawal.principalOpening;
                        } else if (doc.type = "Close") {
                            savingLoanWithdrawal.amount = doc.detailDoc.closing.totalDue <= savingWithdrawal.principalOpening ? doc.detailDoc.closing.totalDue : savingWithdrawal.principalOpening;
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

                        SavingTransaction.insert(savingLoanWithdrawal, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
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
                                updatePay.isPay = false;
                                updatePay.isFullPay = true;
                            } else {
                                updatePay.isPay = false;
                                updatePay.isFullPay = false;
                            }

                            updatePay.isPrePay = true;

                            RepaymentSchedule.update({_id: o.scheduleId}, {
                                $set: updatePay
                            }, function (err) {
                                if (err) {
                                    console.log(err);
                                }
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

                            SavingTransaction.insert(savingLoanDeposit, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
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

                        SavingTransaction.insert(savingLoanDeposit,function (err) {
                            if(err){
                                console.log(err);
                            }
                        });
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

                        SavingTransaction.insert(savingLoanWithdrawal,function (err) {
                            if(err){
                                console.log(err);
                            }
                        });
                    }
                }
            }

            //End Saving Link


            // Update loan acc for close type
            if (doc.type == 'Close') {
                // Set close status on loan acc
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {closeDate: doc.repaidDate, status: "Close"}},function (err) {
                    if(err){
                        console.log(err);
                    }
                });
            }


        });
    } else {
        // Insert Data to Saving

        let loanAcc = LoanAcc.findOne({_id: doc.loanAccId});
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

                SavingTransaction.insert(savingLoanWithdrawal,function (err) {
                    if(err){
                        console.log(err);
                    }
                });
            }
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {feeAmount: doc.amountPaid}},function (err) {
            if(err){
                console.log(err);
            }
        });
    }

    LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: 1}},function (err) {
        if(err){
            console.log(err);
        }
    });

})
;


// After remove
Repayment.after.remove(function (userId, doc) {
    if (doc.type != "Fee") {
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
                            },function (err) {
                                if(err){
                                    console.log(err);
                                }
                            });
                        });
                    }
                }


            } else if (doc.type == "Prepay") {
                if (doc.detailDoc) {
                    if (doc.detailDoc.schedulePaid) {
                        let schedulePaid = doc.detailDoc.schedulePaid;

                        _.forEach(schedulePaid, (o) => {

                            RepaymentSchedule.update({_id: o.scheduleId}, {
                                $set: {isPay: false, isFullPay: false, isPrePay: false}
                            },function (err) {
                                if(err){
                                    console.log(err);
                                }
                            });
                        });
                    }
                }
            } else if (["Reschedule", "Write Off"].includes(doc.type) == true) {

                if (doc.type == "Reschedule") {
                    RepaymentSchedule.remove({scheduleDate: doc.repaidDate, loanAccId: doc.loanAccId});
                }

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
        });
    } else {
        LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {feeAmount: 0}},function (err) {
            if(err){
                console.log(err);
            }
        });


    }

    LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: -1}});
    SavingTransaction.remove({paymentId: doc._id});
    let countSaving = SavingTransaction.find({savingAccId: doc.savingAccId}).count();
    SavingAcc.direct.update({_id: doc.savingAccId}, {$set: {savingNumber: countSaving}});


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
            maturityDate = moment(value.dueDate).startOf("day").toDate();
        }

        // Save to repayment schedule collection
        value.scheduleDate = moment(doc.repaidDate).startOf("day").toDate();
        value.dueDate= moment(val.dueDate).startOf("day").toDate();
        value.loanAccId = doc.loanAccId;
        value.savingAccId = doc.savingAccId;
        value.branchId = doc.branchId;


        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on loan acc
    LoanAcc.direct.update({_id: doc._id}, {$set: {maturityDate: maturityDate, tenor: tenor}});
}