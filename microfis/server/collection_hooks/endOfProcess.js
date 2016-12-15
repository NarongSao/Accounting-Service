import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';
import {Repayment} from '../../common/collections/repayment.js';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';
import {checkRepayment} from '../../common/methods/check-repayment.js';
import {checkSavingTransaction} from '../../common/methods/check-saving-transaction.js';
import {MakeRepayment} from '../../common/libs/make-repayment.js';

EndOfProcess.before.insert(function (userId, doc) {

    let date = moment(doc.closeDate, "DD/MM/YYYY").format("YYMM");
    let prefix = doc.branchId + "-" + date;
    doc._id = idGenerator.genWithPrefix(EndOfProcess, prefix, 6);
    doc.month = moment(doc.closeDate, "DD/MM/YYYY").format("MM");
    doc.day = moment(doc.closeDate, "DD/MM/YYYY").format("DD");
    doc.year = moment(doc.closeDate, "DD/MM/YYYY").format("YYYY");

});

EndOfProcess.after.insert(function (userId, doc) {

    let tDate = moment(doc.closeDate).endOf('day').toDate();
    console.log(moment.tz.guess());
    console.log(moment(doc.closeDate).endOf('day').toDate());
    let selectorPay = {};
    selectorPay.dueDate = {$lte: tDate};
    selectorPay.branchId = doc.branchId;
    selectorPay.isPay = false;
    selectorPay.installment = {$gt: 0};
    /*selectorPay.isPrePay = true;*/

    let detailPaid = [];
    let schedulePay = RepaymentSchedule.find(selectorPay).fetch();

    schedulePay.forEach(function (obj) {
        let checkPayment = checkRepayment.run({loanAccId: obj.loanAccId, checkDate: doc.closeDate});

        if (checkPayment) {

            let amountPaid = 0;
            let savingTransaction = SavingTransaction.findOne({savingAccId: obj.savingAccId}, {
                sort: {
                    _id: -1,
                    transactionDate: -1
                }
            });
            console.log("Saving Transaction");
            console.log(savingTransaction);
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

                    console.log("Make Payment");
                    console.log(makeRepayment);

                    //Make Payment To Update Scedule
                    if (makeRepayment) {
                        if (makeRepayment.schedulePaid) {
                            let schedulePaid = makeRepayment.schedulePaid;
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
                                o.endId = doc._id;

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

                                o.isFullPay = obj.isFullPay;
                                detailPaid.push(o);

                            });

                        }
                    }


                    //Withdrawal
                    let savingWithdrawal = checkSavingTransaction.run({
                        savingAccId: obj.savingAccId,
                        checkDate: doc.closeDate
                    })


                    let savingLoanWithdrawal = {};
                    savingLoanWithdrawal.paymentId = savingTransaction.paymentId;

                    if (savingWithdrawal) {
                        savingLoanWithdrawal.branchId = doc.branchId;
                        savingLoanWithdrawal.savingAccId = obj.savingAccId;
                        savingLoanWithdrawal.transactionDate = doc.closeDate;
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

                    Repayment.direct.update({_id: savingTransaction.paymentId}, {$set: {endId: doc._id}}, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });

                }
            }

        }


    })

    EndOfProcess.direct.update({_id: doc._id}, {$set: {detailPaid: detailPaid}}, function (err) {
        if (err) {
            console.log(err);
        }
    });
})

EndOfProcess.after.remove(function (userId, doc) {

    if (doc.detailPaid) {
        doc.detailPaid.forEach(function (o) {
            console.log(o);
            RepaymentSchedule.update({_id: o.scheduleId}, {
                $inc: {
                    'repaymentDoc.totalPrincipalPaid': -o.principalPaid,
                    'repaymentDoc.totalInterestPaid': -o.interestPaid,
                    'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
                    'repaymentDoc.totalInterestWaived': -o.interestWaived,
                },
                $pull: {'repaymentDoc.detail': {endId: doc._id}},
                $set: {isPay: false, isFullPay: o.isFullPay}
            });

            Repayment.direct.update({endId: doc._id}, {$set: {endId: "0"}}, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        })
    }

    SavingTransaction.remove({endId: doc._id})
})