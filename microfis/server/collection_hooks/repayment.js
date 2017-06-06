import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {Client} from '../../common/collections/client';
import {ProductStatus} from '../../common/collections/productStatus';
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';
import {SavingAcc} from '../../common/collections/saving-acc.js';
import {Setting} from '../../../core/common/collections/setting';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing.js';
import {Journal} from '../../../acc/imports/api/collections/journal';

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

    Meteor.defer(function () {

        let settingDoc = Setting.findOne();
        if (doc.type != "Fee") {
            Meteor.defer(function () {

                let loanAcc = LoanAcc.findOne({_id: doc.loanAccId});
                let clientDoc = Client.findOne({_id: loanAcc.clientId});
                let loanType = "";


                if (settingDoc.integrate == true) {
                    if (doc.type != "Write Off" && doc.type != "Reschedule" && doc.type != "Prepay") {
                        let productStatusList;
                        if (loanAcc.paymentMethod == "D") {
                            if (loanAcc.term <= 365) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }
                        } else if (loanAcc.paymentMethod == "W") {
                            if (loanAcc.term <= 52) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }
                        } else if (loanAcc.paymentMethod == "M") {
                            if (loanAcc.term <= 12) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }


                        let finProductStatus = function (obj) {
                            return (doc.detailDoc.totalScheduleDue.numOfDayLate < 0 ? 0 : doc.detailDoc.totalScheduleDue.numOfDayLate) >= obj.from && (doc.detailDoc.totalScheduleDue.numOfDayLate < 0 ? 0 : doc.detailDoc.totalScheduleDue.numOfDayLate) <= obj.to;
                        }

                        let proStatus = productStatusList.find(finProductStatus);
                        loanType = proStatus._id;
                    }

                }


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
                                        'repaymentDoc.totalFeeOnPaymentPaid': o.feeOnPaymentPaid,
                                        'repaymentDoc.totalPenaltyPaid': o.penaltyPaid,
                                        'repaymentDoc.totalInterestWaived': o.interestWaived,
                                        'repaymentDoc.totalFeeOnPaymentWaived': o.feeOnPaymentWaived,


                                        'repaymentDocRealTime.totalPrincipalPaid': o.principalPaid,
                                        'repaymentDocRealTime.totalInterestPaid': o.interestPaid,
                                        'repaymentDocRealTime.totalFeeOnPaymentPaid': o.feeOnPaymentPaid,
                                        'repaymentDocRealTime.totalPenaltyPaid': o.penaltyPaid,
                                        'repaymentDocRealTime.totalInterestWaived': o.interestWaived,
                                        'repaymentDocRealTime.totalFeeOnPaymentWaived': o.feeOnPaymentWaived
                                    },
                                    $push: {'repaymentDoc.detail': o, 'repaymentDocRealTime.detail': o},
                                    $set: updatePay
                                }, function (err) {
                                    if (err) {
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
                            savingLoanDeposit.amount = doc.totalPaid;
                            savingLoanDeposit.savingAccId = loanAcc.savingAccId;
                            savingLoanDeposit.transactionDate = doc.repaidDate;
                            savingLoanDeposit.voucherId = doc.voucherId;
                            savingLoanDeposit.memo = doc.note;
                            savingLoanDeposit.currencyId = doc.currencyId;


                            savingDeposit.principalBal = new BigNumber(savingDeposit.principalOpening).plus(doc.totalPaid).toNumber();

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
                            } else if (doc.type == "Close") {
                                savingLoanWithdrawal.amount = doc.detailDoc.closing.totalDue + doc.detailDoc.totalSchedulePaid.totalAmountPaid <= savingWithdrawal.principalOpening ? doc.detailDoc.closing.totalDue + doc.detailDoc.totalSchedulePaid.totalAmountPaid : savingWithdrawal.principalOpening;
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

                    //    Integrated to Account========================================================================================================================


                    if (settingDoc.integrate == true) {

                        if (doc.type == "General") {
                            let dataForAccount = {};

                            dataForAccount.journalDate = doc.repaidDate;
                            dataForAccount.branchId = doc.branchId;
                            dataForAccount.voucherId = doc.voucherId.substring(8, 20);
                            dataForAccount.currencyId = doc.currencyId;
                            dataForAccount.memo = "Loan Repayment General " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                            dataForAccount.refId = doc._id;
                            dataForAccount.refFrom = "Repayment General";
                            dataForAccount.total = doc.totalPaid - doc.waivedForClosing;

                            let transaction = [];


                            let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
                            let acc_penalty = MapClosing.findOne({chartAccountCompare: "Penalty"});
                            let acc_feeOnPayment = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});
                            let acc_unEarnIncome = MapClosing.findOne({chartAccountCompare: "Unearn Income"});
                            let acc_principal = checkPrincipal(loanAcc, loanType);
                            let acc_interest = checkInterest(loanAcc, loanType);


                            transaction.push({
                                account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
                                dr: doc.totalPaid,
                                cr: 0,
                                drcr: doc.totalPaid

                            });

                            transaction.push({
                                account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                dr: 0,
                                cr: doc.detailDoc.totalSchedulePaid.principalPaid,
                                drcr: -doc.detailDoc.totalSchedulePaid.principalPaid
                            });
                            transaction.push({
                                account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                                dr: 0,
                                cr: doc.detailDoc.totalSchedulePaid.interestPaid,
                                drcr: -doc.detailDoc.totalSchedulePaid.interestPaid
                            });
                            transaction.push({
                                account: acc_penalty.accountDoc.code + " | " + acc_penalty.accountDoc.name,
                                dr: 0,
                                cr: doc.detailDoc.totalSchedulePaid.penaltyPaid,
                                drcr: -doc.detailDoc.totalSchedulePaid.penaltyPaid
                            });
                            transaction.push({
                                account: acc_feeOnPayment.accountDoc.code + " | " + acc_feeOnPayment.accountDoc.name,
                                dr: 0,
                                cr: doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid,
                                drcr: -doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid
                            });

                            transaction.push({
                                account: acc_unEarnIncome.accountDoc.code + " | " + acc_unEarnIncome.accountDoc.name,
                                dr: 0,
                                cr: doc.totalPaid - (doc.detailDoc.totalSchedulePaid.principalPaid + doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.totalSchedulePaid.penaltyPaid + doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid),
                                drcr: -(doc.totalPaid - (doc.detailDoc.totalSchedulePaid.principalPaid + doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.totalSchedulePaid.penaltyPaid + doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid))
                            });


                            dataForAccount.transaction = transaction;
                            Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                                if (err) {
                                    console.log(err.message);
                                }
                            })
                        } else if (doc.type == "Close") {
                            let dataForAccount = {};

                            dataForAccount.journalDate = doc.repaidDate;
                            dataForAccount.branchId = doc.branchId;
                            dataForAccount.voucherId = doc.voucherId.substring(8, 20);
                            dataForAccount.currencyId = doc.currencyId;
                            dataForAccount.memo = "Loan Repayment Closing " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                            dataForAccount.refId = doc._id;
                            dataForAccount.refFrom = "Repayment Closing";
                            dataForAccount.total = doc.totalPaid;

                            let transaction = [];


                            let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
                            let acc_otherInterestIncome = MapClosing.findOne({chartAccountCompare: "Other Interest Income"});
                            let acc_penalty = MapClosing.findOne({chartAccountCompare: "Penalty"});
                            let acc_feeOnPayment = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});
                            let acc_unEarnIncome = MapClosing.findOne({chartAccountCompare: "Unearn Income"});
                            let acc_principal = checkPrincipal(loanAcc, loanType);
                            let acc_interest = checkInterest(loanAcc, loanType);


                            transaction.push({
                                    account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
                                    dr: doc.totalPaid,
                                    cr: 0,
                                    drcr: doc.totalPaid

                                },
                                {
                                    account: acc_unEarnIncome.accountDoc.code + " | " + acc_unEarnIncome.accountDoc.name,
                                    dr: doc.savingBalance,
                                    cr: 0,
                                    drcr: doc.savingBalance
                                },
                                {
                                    account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                    dr: 0,
                                    cr: doc.detailDoc.totalSchedulePaid.principalPaid,
                                    drcr: -doc.detailDoc.totalSchedulePaid.principalPaid
                                }, {
                                    account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                                    dr: 0,
                                    cr: doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.closing.interestAddition,
                                    drcr: -(doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.closing.interestAddition)
                                }, {
                                    account: acc_otherInterestIncome.accountDoc.code + " | " + acc_otherInterestIncome.accountDoc.name,
                                    dr: 0,
                                    cr: doc.totalPaid + doc.savingBalance - (doc.detailDoc.totalSchedulePaid.principalPaid + doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.totalSchedulePaid.penaltyPaid + doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid + doc.detailDoc.closing.interestAddition),
                                    drcr: -(doc.totalPaid + doc.savingBalance - (doc.detailDoc.totalSchedulePaid.principalPaid + doc.detailDoc.totalSchedulePaid.interestPaid + doc.detailDoc.totalSchedulePaid.penaltyPaid + doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid + doc.detailDoc.closing.interestAddition))
                                }, {
                                    account: acc_penalty.accountDoc.code + " | " + acc_penalty.accountDoc.name,
                                    dr: 0,
                                    cr: doc.detailDoc.totalSchedulePaid.penaltyPaid,
                                    drcr: -doc.detailDoc.totalSchedulePaid.penaltyPaid
                                }, {
                                    account: acc_feeOnPayment.accountDoc.code + " | " + acc_feeOnPayment.accountDoc.name,
                                    dr: 0,
                                    cr: doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid,
                                    drcr: -doc.detailDoc.totalSchedulePaid.feeOnPaymentPaid
                                });

                            dataForAccount.transaction = transaction;
                            Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                                if (err) {
                                    console.log(err.message);
                                }
                            })
                        }

                    }
                    //    ==================================================================================================================================================
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
                                o.repaymentId = doc._id;
                                RepaymentSchedule.update({_id: o.scheduleId}, {
                                    $inc: {
                                        'repaymentDocRealTime.totalPrincipalPaid': o.principalPaid,
                                        'repaymentDocRealTime.totalInterestPaid': o.interestPaid,
                                        'repaymentDocRealTime.totalFeeOnPaymentPaid': o.feeOnPaymentPaid,
                                        'repaymentDocRealTime.totalPenaltyPaid': o.penaltyPaid,
                                        'repaymentDocRealTime.totalInterestWaived': o.interestWaived,
                                        'repaymentDocRealTime.totalFeeOnPaymentWaived': o.feeOnPaymentWaived
                                    },
                                    $push: {'repaymentDocRealTime.detail': o},
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


                        //    Integrated to Account========================================================================================================================


                        if (settingDoc.integrate == true) {

                            if (doc.type == "Prepay") {
                                let dataForAccount = {};

                                dataForAccount.journalDate = doc.repaidDate;
                                dataForAccount.branchId = doc.branchId;
                                dataForAccount.voucherId = doc.voucherId.substring(8, 20);
                                dataForAccount.currencyId = doc.currencyId;
                                dataForAccount.memo = "Loan Repayment Prepay " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                                dataForAccount.refId = doc._id;
                                dataForAccount.refFrom = "Repayment Prepay";
                                dataForAccount.total = doc.totalPaid;

                                let transaction = [];


                                let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
                                let acc_unEarnIncome = MapClosing.findOne({chartAccountCompare: "Unearn Income"});


                                transaction.push({
                                    account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
                                    dr: doc.totalPaid,
                                    cr: 0,
                                    drcr: doc.totalPaid

                                }, {
                                    account: acc_unEarnIncome.accountDoc.code + " | " + acc_unEarnIncome.accountDoc.name,
                                    dr: 0,
                                    cr: doc.totalPaid,
                                    drcr: -doc.totalPaid
                                });

                                dataForAccount.transaction = transaction;
                                Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                                    if (err) {
                                        console.log(err.message);
                                    }
                                })
                            }
                        }
                        //        ====================================================================================================================================

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
                            savingLoanDeposit.amount = doc.totalPaid;
                            savingLoanDeposit.savingAccId = loanAcc.savingAccId;
                            savingLoanDeposit.transactionDate = doc.repaidDate;
                            savingLoanDeposit.voucherId = doc.voucherId;
                            savingLoanDeposit.memo = doc.note;
                            savingLoanDeposit.currencyId = doc.currencyId;


                            savingDeposit.principalBal = new BigNumber(savingDeposit.principalOpening).plus(doc.totalPaid).toNumber();

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


                            savingLoanWithdrawal.amount = doc.totalPaid;


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


                            //    Integrated to Account========================================================================================================================


                            if (settingDoc.integrate == true) {

                                if (doc.type == "Reschedule") {
                                    let dataForAccount = {};

                                    dataForAccount.journalDate = doc.repaidDate;
                                    dataForAccount.branchId = doc.branchId;
                                    dataForAccount.voucherId = doc.voucherId.substring(8, 20);
                                    dataForAccount.currencyId = doc.currencyId;
                                    dataForAccount.memo = "Loan Repayment Reschedule " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                                    dataForAccount.refId = doc._id;
                                    dataForAccount.refFrom = "Repayment Reschedule";
                                    dataForAccount.total = doc.totalPaid;

                                    let transaction = [];


                                    let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
                                    let acc_penalty = MapClosing.findOne({chartAccountCompare: "Penalty"});
                                    let acc_principal = checkPrincipal(loanAcc, "Reschedule");

                                    transaction.push({
                                        account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
                                        dr: doc.totalPaid,
                                        cr: 0,
                                        drcr: doc.totalPaid

                                    }, {
                                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                        dr: 0,
                                        cr: doc.amountPaid,
                                        drcr: -doc.amountPaid
                                    }, {
                                        account: acc_penalty.accountDoc.code + " | " + acc_penalty.accountDoc.name,
                                        dr: 0,
                                        cr: doc.penaltyPaid,
                                        drcr: -doc.penaltyPaid
                                    });


                                    dataForAccount.transaction = transaction;
                                    Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                                        if (err) {
                                            console.log(err.message);
                                        }
                                    })
                                } else if (doc.type == "Write Off") {

                                    Journal.direct.update({
                                            refId: loanAcc._id,
                                            refFrom: "Repayment Write Off",
                                            journalDate: {
                                                $gte: moment(doc.repaidDate).startOf("day").toDate(),
                                                $lte: moment(doc.repaidDate).endOf("day").toDate()
                                            }
                                        },
                                        {
                                            $set: {
                                                refId: doc._id
                                            }
                                        }
                                    )
                                }
                            }
//        ====================================================================================================================================

                        }
                    }
                }

//End Saving Link


// Update loan acc for close type
                if (doc.type == 'Close') {
                    // Set close status on loan acc
                    LoanAcc.direct.update({_id: doc.loanAccId}, {
                        $set: {
                            closeDate: doc.repaidDate,
                            waivedForClosing: doc.waivedForClosing,
                            status: "Close"
                        }
                    }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });


                }
            })
            ;
        } else {
            // Insert Data to Saving

            let loanAcc = LoanAcc.findOne({_id: doc.loanAccId});
            let clientDoc = Client.findOne({_id: loanAcc.clientId});
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

                    SavingTransaction.insert(savingLoanWithdrawal, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }

            //Integrate to Account=============================================================================================================================
            if (settingDoc.integrate == true) {
                let dataForAccount = {};

                dataForAccount.journalDate = doc.repaidDate;
                dataForAccount.branchId = doc.branchId;
                dataForAccount.voucherId = doc.voucherId.substring(8, 20);
                dataForAccount.currencyId = doc.currencyId;
                dataForAccount.memo = "Loan Repayment Fee " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                dataForAccount.refId = doc._id;
                dataForAccount.refFrom = "Repayment Fee";
                dataForAccount.total = doc.amountPaid;

                let transaction = [];


                let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
                let acc_feeOnDisbursement = MapClosing.findOne({chartAccountCompare: "Fee On Disbursement"});


                transaction.push({
                    account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
                    dr: doc.amountPaid,
                    cr: 0,
                    drcr: doc.amountPaid

                }, {
                    account: acc_feeOnDisbursement.accountDoc.code + " | " + acc_feeOnDisbursement.accountDoc.name,
                    dr: 0,
                    cr: doc.amountPaid,
                    drcr: -doc.amountPaid
                });

                dataForAccount.transaction = transaction;
                Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })

            }
            //=============================================================================================================================

            LoanAcc.direct.update({_id: doc.loanAccId}, {
                $set: {
                    feeAmount: doc.amountPaid,
                    feeDate: doc.repaidDate
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: 1}}, function (err) {
            if (err) {
                console.log(err);
            }
        });

    })

});


// After remove
Repayment.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        //Integrate to Account=============================================================================================================================
        let settingDoc = Setting.findOne();
        if (settingDoc.integrate == true) {
            if (doc.type == "General") {
                Meteor.call("api_journalRemove", doc._id, "Repayment General", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            } else if (doc.type == "Close") {
                Meteor.call("api_journalRemove", doc._id, "Repayment Closing", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            } else if (doc.type == "Prepay") {
                Meteor.call("api_journalRemove", doc._id, "Repayment Prepay", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            } else if (doc.type == "Reschedule") {
                Meteor.call("api_journalRemove", doc._id, "Repayment Reschedule", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            } else if (doc.type == "Write Off") {
                Meteor.call("api_journalRemove", doc._id, "Repayment Write Off", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            } else if (doc.type == "Fee") {
                Meteor.call("api_journalRemove", doc._id, "Repayment Fee", function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            }
        }
//=============================================================================================================================
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
                                        'repaymentDoc.totalFeeOnPaymentPaid': -o.feeOnPaymentPaid,
                                        'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
                                        'repaymentDoc.totalInterestWaived': -o.interestWaived,
                                        'repaymentDoc.totalFeeOnPaymentWaived': -o.feeOnPaymentWaived,


                                        'repaymentDocRealTime.totalPrincipalPaid': -o.principalPaid,
                                        'repaymentDocRealTime.totalInterestPaid': -o.interestPaid,
                                        'repaymentDocRealTime.totalFeeOnPaymentPaid': -o.feeOnPaymentPaid,
                                        'repaymentDocRealTime.totalPenaltyPaid': -o.penaltyPaid,
                                        'repaymentDocRealTime.totalInterestWaived': -o.interestWaived,
                                        'repaymentDocRealTime.totalFeeOnPaymentWaived': -o.feeOnPaymentWaived
                                    },
                                    $pull: {
                                        'repaymentDoc.detail': {repaymentId: doc._id},
                                        'repaymentDocRealTime.detail': {repaymentId: doc._id}
                                    },
                                    $set: {isPay: false, isFullPay: false}
                                }, function (err) {
                                    if (err) {
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
                                    $set: {isPay: false, isFullPay: false, isPrePay: false},
                                    $inc: {

                                        'repaymentDocRealTime.totalPrincipalPaid': -o.principalPaid,
                                        'repaymentDocRealTime.totalInterestPaid': -o.interestPaid,
                                        'repaymentDocRealTime.totalFeeOnPaymentPaid': -o.feeOnPaymentPaid,
                                        'repaymentDocRealTime.totalPenaltyPaid': -o.penaltyPaid,
                                        'repaymentDocRealTime.totalInterestWaived': -o.interestWaived,
                                        'repaymentDocRealTime.totalFeeOnPaymentWaived': -o.feeOnPaymentWaived
                                    },
                                    $pull: {
                                        'repaymentDocRealTime.detail': {repaymentId: doc._id}
                                    }

                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            });
                        }
                    }
                } else if (["Reschedule", "Write Off"].includes(doc.type) == true) {

                    if (doc.type == "Reschedule") {
                        RepaymentSchedule.remove({
                            scheduleDate: {
                                $gte: moment(doc.repaidDate).startOf("day").toDate(),
                                $lte: moment(doc.repaidDate).endOf("day").toDate()
                            }, loanAccId: doc.loanAccId
                        });
                    }

                }
                //End Saving Link

                // Update loan acc for close type
                if (doc.type == 'Close') {
                    // Set close status on loan acc
                    LoanAcc.direct.update({_id: doc.loanAccId},
                        {$set: {waivedForClosing: doc.waivedForClosing}},
                        {
                            $unset: {
                                closeDate: ''
                            }
                        }
                    );

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
            LoanAcc.direct.update({_id: doc.loanAccId}, {
                    $set: {feeAmount: 0}, $unset: {feeDate: ""}
                },
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: -1}});
        SavingTransaction.remove({paymentId: doc._id});
        let countSaving = SavingTransaction.find({savingAccId: doc.savingAccId}).count();
        SavingAcc.direct.update({_id: doc.savingAccId}, {$set: {savingNumber: countSaving}});
    })

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
        value.dueDate = moment(value.dueDate).startOf("day").toDate();
        value.loanAccId = doc.loanAccId;
        value.savingAccId = doc.savingAccId;
        value.branchId = doc.branchId;


        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on loan acc
    LoanAcc.direct.update({_id: doc._id}, {$set: {maturityDate: maturityDate, tenor: tenor}});
}


let checkPrincipal = function (doc, loanType) {

    let acc_principal = {}

    if (loanType == "001" || loanType == "005" || loanType == "Reschedule") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Less than or Equal One Year"});
                }

            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "002" || loanType == "006") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Substandard Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "003" || loanType == "007") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Doubtful Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "004" || loanType == "008" || loanType == "Loss") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
            }
        }
    }


    return acc_principal;
}


let checkInterest = function (doc, loanType) {

    let acc_interest = {}

    if (loanType == "001" || loanType == "005" || loanType == "Reschedule") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Less than or Equal One Year"});
                }

            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Standard Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "002" || loanType == "006") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Substandard Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "003" || loanType == "007") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Doubtful Loan Related Party Employees Over One Year"});
            }
        }
    } else if (loanType == "004" || loanType == "008" || loanType == "Loss") {
        if (doc.paymentMethod == "D") {
            if (doc.term <= 365) {

                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
                }


            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
                }
            }

        } else if (doc.paymentMethod == "W") {
            if (doc.term <= 52) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
                }
            }
        } else if (doc.paymentMethod == "M") {
            if (doc.term <= 12) {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
                }
            } else {
                if (doc.accountType == "IL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
                } else if (doc.accountType == "GL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

                } else if (doc.accountType == "EL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

                } else if (doc.accountType == "OL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

                } else if (doc.accountType == "RPAL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

                } else if (doc.accountType == "RPSL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

                } else if (doc.accountType == "RPML") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

                } else if (doc.accountType == "RPEL") {
                    acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
                }
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
            }
        }
    }


    return acc_interest;
}
