import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';

import {ClearPrepay} from '../../common/collections/clearPrepay';
import {ProductStatus} from '../../common/collections/productStatus';
import {Repayment} from '../../common/collections/repayment.js';
import {LoanAcc} from '../../common/collections/loan-acc';
import {Client} from '../../common/collections/client';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';
import {checkRepayment} from '../../common/methods/check-repayment.js';
import {checkSavingTransaction} from '../../common/methods/check-saving-transaction.js';
import {MakeRepayment} from '../../common/libs/make-repayment.js';
import {Setting} from '../../../core/common/collections/setting';

import ClassCompareAccount from "../../imports/libs/classCompareAccount"


ClearPrepay.before.insert(function (userId, doc) {

    let date = moment(doc.closeDate, "DD/MM/YYYY").format("YYMM");
    let prefix = doc.branchId + "-" + date;
    doc._id = idGenerator.genWithPrefix(ClearPrepay, prefix, 6);
    doc.month = moment(doc.closeDate, "DD/MM/YYYY").format("MM");
    doc.day = moment(doc.closeDate, "DD/MM/YYYY").format("DD");
    doc.year = moment(doc.closeDate, "DD/MM/YYYY").format("YYYY");
    doc.status = false;

});

ClearPrepay.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        let detailPaid = [];
        let settingDoc = Setting.findOne();

        let lastClearPrepayList = ClearPrepay.findOne({
            branchId: doc.branchId,
            _id: {$ne: doc._id}
        }, {sort: {closeDate: -1}});


        let lastClearPrepay = lastClearPrepayList.closeDate == undefined ? doc.closeDate : lastClearPrepayList.closeDate;
        while (lastClearPrepay.getTime() <= moment(doc.closeDate).endOf("days").toDate().getTime()) {

            let tDate = moment(lastClearPrepay).endOf('day').toDate();

            let selectorPay = {};
            selectorPay.dueDate = {$lte: tDate};
            selectorPay.branchId = doc.branchId;
            selectorPay.isPay = false;
            selectorPay.installment = {$gt: 0};
            selectorPay.isPrePay = true;

            selectorPay.branchId = doc.branchId;

            let loanListEnd = RepaymentSchedule.aggregate([
                {$match: selectorPay},
                {
                    $group: {
                        _id: {
                            "loanAccId": "$loanAccId",
                            "savingAccId": "$savingAccId"
                        }
                    }
                }
            ]);

            loanListEnd.forEach(function (obj) {
                let checkPayment = checkRepayment.run({loanAccId: obj._id.loanAccId, checkDate: tDate});

                if (checkPayment) {

                    let amountPaid = 0;
                    let savingTransaction = SavingTransaction.findOne({savingAccId: obj._id.savingAccId}, {
                        sort: {
                            _id: -1,
                            transactionDate: -1
                        }
                    });

                    if (savingTransaction) {
                        if (math.round(savingTransaction.details.principalBal + savingTransaction.details.interestBal, 2) > 0) {

                            if (checkPayment.totalScheduleDue.totalPrincipalInterestDue < (savingTransaction.details.principalBal + savingTransaction.details.interestBal)) {
                                amountPaid = math.round(checkPayment.totalScheduleDue.totalPrincipalInterestDue, 2);


                            } else {

                                amountPaid = math.round(savingTransaction.details.principalBal + savingTransaction.details.interestBal, 2);
                            }

                            let makeRepayment = MakeRepayment.general({
                                repaidDate: tDate,
                                amountPaid: amountPaid,
                                penaltyPaid: 0,
                                scheduleDue: checkPayment.scheduleDue,
                                totalScheduleDue: checkPayment.totalScheduleDue
                            });

                            let paymentIdList = [];

                            //Make Payment To Update Scedule
                            if (makeRepayment) {
                                if (makeRepayment.schedulePaid) {
                                    let schedulePaid = makeRepayment.schedulePaid;
                                    _.forEach(schedulePaid, (o) => {


                                        let isFullPay = RepaymentSchedule.findOne({_id: o.scheduleId}).isFullPay;

                                        let updatePay = {};
                                        if (o.totalPrincipalInterestBal == 0) {
                                            updatePay.isPay = true;
                                            updatePay.isFullPay = true;
                                        } else {
                                            updatePay.isPay = false;
                                            updatePay.isFullPay = false;
                                        }

                                        o.repaymentId = savingTransaction.paymentId;
                                        o.endId = doc._id;

                                        paymentIdList.push(savingTransaction.paymentId);


                                        let prepaidDoc = RepaymentSchedule.findOne({_id: o.scheduleId});

                                        if (prepaidDoc.repaymentDocRealTime && prepaidDoc.repaymentDocRealTime.detail.length > 0) {
                                            prepaidDoc.repaymentDocRealTime.detail.forEach(function (obj) {
                                                obj.endId = doc._id;
                                                obj.numOfDayLate = 0;
                                                obj.repaidDate = tDate;
                                            })
                                        }


                                        updatePay["repaymentDoc"] = prepaidDoc.repaymentDocRealTime;

                                        RepaymentSchedule.update({_id: o.scheduleId}, {
                                            /*$inc: {
                                             'repaymentDoc.totalPrincipalPaid': o.principalPaid,
                                             'repaymentDoc.totalInterestPaid': o.interestPaid,
                                             'repaymentDoc.totalFeeOnPaymentPaid': o.feeOnPaymentPaid,
                                             'repaymentDoc.totalPenaltyPaid': o.penaltyPaid,
                                             'repaymentDoc.totalInterestWaived': o.interestWaived,
                                             'repaymentDoc.totalFeeOnPaymentWaived': o.feeOnPaymentWaived
                                             },*/
                                            // $push: {'repaymentDoc.detail': o},
                                            $set: updatePay
                                        });


                                        o.isFullPay = isFullPay;
                                        detailPaid.push(o);


                                        let repaymentList = RepaymentSchedule.aggregate([
                                            {$match: {_id: o.scheduleId, repaymentDocRealTime: {$ne: undefined}}},
                                            {$unwind: "$repaymentDocRealTime.detail"}
                                        ]).map(function (obj) {
                                            if (obj.repaymentDocRealTime.detail.repaymentId) {
                                                return obj.repaymentDocRealTime.detail.repaymentId;
                                            }
                                        });

                                        paymentIdList = paymentIdList.concat(repaymentList);


                                        //    Integrated to Account========================================================================================================================

                                        if (settingDoc.integrate == true) {
                                            let loanAcc = LoanAcc.findOne({_id: obj._id.loanAccId});
                                            let clientDoc = Client.findOne({_id: loanAcc.clientId});


                                            let dataForAccount = {};

                                            dataForAccount.journalDate = o.repaidDate;
                                            dataForAccount.branchId = savingTransaction.branchId;
                                            dataForAccount.voucherId = savingTransaction.voucherId.substring(8, 20);
                                            dataForAccount.currencyId = savingTransaction.currencyId;
                                            dataForAccount.memo = "Clear Repayment End Of Process " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                                            dataForAccount.refId = doc._id;
                                            dataForAccount.refFrom = "Repayment End Of Process";
                                            dataForAccount.total = o.totalPrincipalInterestPaid;

                                            let transaction = [];


                                            let acc_unEarnIncome = MapClosing.findOne({chartAccountCompare: "Unearn Income"});
                                            let acc_feeOnPayment = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});
                                            let acc_principal = ClassCompareAccount.checkPrincipal(loanAcc, "001");
                                            let acc_interest = ClassCompareAccount.checkInterest(loanAcc, "005");


                                            transaction.push({
                                                account: acc_unEarnIncome.accountDoc.code + " | " + acc_unEarnIncome.accountDoc.name,
                                                dr: o.totalPrincipalInterestPaid,
                                                cr: 0,
                                                drcr: o.totalPrincipalInterestPaid
                                            }, {
                                                account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                                dr: 0,
                                                cr: o.principalPaid,
                                                drcr: -o.principalPaid
                                            }, {
                                                account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                                                dr: 0,
                                                cr: o.interestPaid,
                                                drcr: -o.interestPaid
                                            }, {
                                                account: acc_feeOnPayment.accountDoc.code + " | " + acc_feeOnPayment.accountDoc.name,
                                                dr: 0,
                                                cr: o.feeOnPaymentPaid,
                                                drcr: -o.feeOnPaymentPaid
                                            });

                                            dataForAccount.transaction = transaction;
                                            Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                                                if (err) {
                                                    console.log(err.message);
                                                }
                                            })

                                        }
                                        //    =====================================================================================================

                                    });

                                }
                            }


                            //Withdrawal
                            let savingWithdrawal = checkSavingTransaction.run({
                                savingAccId: obj._id.savingAccId,
                                checkDate: tDate
                            })


                            let savingLoanWithdrawal = {};
                            savingLoanWithdrawal.paymentId = savingTransaction.paymentId;

                            if (savingWithdrawal) {
                                savingLoanWithdrawal.branchId = doc.branchId;
                                savingLoanWithdrawal.savingAccId = obj._id.savingAccId;
                                savingLoanWithdrawal.transactionDate = tDate;
                                savingLoanWithdrawal.voucherId = savingTransaction.voucherId;
                                savingLoanWithdrawal.memo = savingTransaction.note;
                                savingLoanWithdrawal.currencyId = savingTransaction.currencyId;


                                savingLoanWithdrawal.amount = amountPaid;

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
                                savingLoanWithdrawal.endId = doc._id;


                                SavingTransaction.insert(savingLoanWithdrawal, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }

                                });
                            }

                            Repayment.direct.update({_id: {$in: paymentIdList}}, {
                                    $set: {
                                        endId: doc._id,
                                        endDate: tDate
                                    },
                                    $push: {
                                        endDateList: {clearDate: tDate}
                                    }
                                }, {multi: true},
                                function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                }
                            );

                        }
                    }

                }

            })

            ClearPrepay.direct.update({_id: doc._id}, {$set: {detailPaid: detailPaid}}, {multi: true}, function (err) {
                if (err) {
                    console.log(err);
                }
            });


            //Increment Date
            lastClearPrepay = moment(lastClearPrepay).add(1, "days").toDate();
        }
        ClearPrepay.direct.update({_id: doc._id}, {$set: {status: true}}, {multi: true}, function (err) {
            if (err) {
                console.log(err);
            }
        });

    })
})

ClearPrepay.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        if (doc.detailPaid) {
            doc.detailPaid.forEach(function (o) {
                RepaymentSchedule.update({_id: o.scheduleId}, {
                    $inc: {
                        'repaymentDoc.totalPrincipalPaid': -o.principalPaid,
                        'repaymentDoc.totalInterestPaid': -o.interestPaid,
                        'repaymentDoc.totalFeeOnPaymentPaid': -o.feeOnPaymentPaid,
                        'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
                        'repaymentDoc.totalInterestWaived': -o.interestWaived,
                        'repaymentDoc.totalFeeOnPaymentWaived': -o.feeOnPaymentWaived
                    },
                    $pull: {'repaymentDoc.detail': {endId: doc._id}},
                    $set: {isPay: false, isFullPay: o.isFullPay}
                });

                Repayment.direct.update({endId: doc._id}, {
                    $set: {
                        endId: "0",
                        endDate: "",
                        endDateList: []
                    }
                }, {multi: true}, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            })
        }
        //    Integrated to Account========================================================================================================================
        let settingDoc = Setting.findOne();
        if (settingDoc.integrate == true) {
            Meteor.call("api_journalRemove", doc._id, "Repayment End Of Process", function (err, result) {
                if (err) {
                    console.log(err.message);
                }
            })

        }
        //   ========================================================================================================================
        SavingTransaction.remove({endId: doc._id})

    })
})
