import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';

// Collection
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';

import {EndOfProcess} from '../../common/collections/endOfProcess.js';
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

import ClassCompareAccount  from "../../imports/libs/classCompareAccount"


EndOfProcess.before.insert(function (userId, doc) {
    let date = moment(doc.closeDate, "DD/MM/YYYY").format("YYMM");
    let prefix = doc.branchId + "-" + date;
    doc._id = idGenerator.genWithPrefix(EndOfProcess, prefix, 6);
    doc.month = moment(doc.closeDate, "DD/MM/YYYY").format("MM");
    doc.day = moment(doc.closeDate, "DD/MM/YYYY").format("DD");
    doc.year = moment(doc.closeDate, "DD/MM/YYYY").format("YYYY");
    doc.status = false;

});

EndOfProcess.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        let settingDoc = Setting.findOne();
        let lastEndOfProcessList = EndOfProcess.find({
            branchId: doc.branchId,
            _id: {$ne: doc._id}
        }, {sort: {closeDate: -1}, limit: 1}).fetch();

        let i = 0;
        let lastEndOfProcess = lastEndOfProcessList[0].closeDate == undefined ? doc.closeDate : moment(lastEndOfProcessList[0].closeDate).add(1, "days").toDate();
        while (lastEndOfProcess.getTime() <= moment(doc.closeDate).endOf("days").toDate().getTime()) {

            let tDate = moment(lastEndOfProcess).endOf('day').toDate();


            //    Adjust Principal Balance
            //    Integrated to Account========================================================================================================================


            Meteor.defer(function () {
                if (settingDoc.integrate == true) {
                    let selector = {};
                    selector.disbursementDate = {$lte: tDate};
                    selector['$or'] = [{status: "Active"},
                        {closeDate: {$exists: true, $gt: tDate}},
                        {writeOffDate: {$exists: true, $gt: tDate}},
                        {restructureDate: {$exists: true, $gt: tDate}}
                    ];
                    selector.branchId = doc.branchId;

                    let loanAccPrincipalList = LoanAcc.find(selector).fetch();

                    let transactionUSD = [];
                    let transactionKHR = [];
                    let transactionTHB = [];

                    let totalUSD = 0;
                    let totalKHR = 0;
                    let totalTHB = 0;


                    loanAccPrincipalList.forEach(function (obj) {
                        if (obj) {
                            let checkPyamentBefore = checkRepayment.run({
                                loanAccId: obj._id,
                                checkDate: moment(tDate).add(-1, "days").toDate()
                            });
                            let checkPayment = checkRepayment.run({loanAccId: obj._id, checkDate: tDate});
                            let productStatusList;
                            if (obj.paymentMethod == "D") {
                                if (obj.term <= 365) {
                                    productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                                } else {
                                    productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                                }

                            } else if (obj.paymentMethod == "W") {
                                if (obj.term <= 52) {
                                    productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                                } else {
                                    productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                                }
                            } else if (obj.paymentMethod == "M") {
                                if (obj.term <= 12) {
                                    productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                                } else {
                                    productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                                }
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }

                            let finProductStatus = function (obj) {
                                return (checkPayment.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPayment.totalScheduleDue.numOfDayLate) >= obj.from && (checkPayment.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPayment.totalScheduleDue.numOfDayLate) <= obj.to;
                            }

                            let findProductStatusBefore = function (obj) {
                                return (checkPyamentBefore.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPyamentBefore.totalScheduleDue.numOfDayLate) >= obj.from && (checkPyamentBefore.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPyamentBefore.totalScheduleDue.numOfDayLate) <= obj.to;
                            }

                            let proStatus = productStatusList.find(finProductStatus);
                            let proStatusBefore = productStatusList.find(findProductStatusBefore);

                            if (proStatus._id != proStatusBefore._id) {

                                let acc_principalBefore = ClassCompareAccount.checkPrincipal(obj, proStatusBefore._id);
                                let acc_principal = ClassCompareAccount.checkPrincipal(obj, proStatus._id);


                                if (obj.currencyId == "USD") {
                                    totalUSD += checkPayment.balanceUnPaid;
                                    transactionUSD.push({
                                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                        dr: checkPayment.balanceUnPaid,
                                        cr: 0,
                                        drcr: checkPayment.balanceUnPaid

                                    }, {
                                        account: acc_principalBefore.accountDoc.code + " | " + acc_principalBefore.accountDoc.name,
                                        dr: 0,
                                        cr: checkPayment.balanceUnPaid,
                                        drcr: -checkPayment.balanceUnPaid
                                    });
                                } else if (obj.currencyId == "KHR") {
                                    totalKHR += checkPayment.balanceUnPaid;
                                    transactionKHR.push({
                                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                        dr: checkPayment.balanceUnPaid,
                                        cr: 0,
                                        drcr: checkPayment.balanceUnPaid

                                    }, {
                                        account: acc_principalBefore.accountDoc.code + " | " + acc_principalBefore.accountDoc.name,
                                        dr: 0,
                                        cr: checkPayment.balanceUnPaid,
                                        drcr: -checkPayment.balanceUnPaid
                                    });
                                } else if (obj.currencyId == "THB") {
                                    totalTHB += checkPayment.balanceUnPaid;
                                    transactionTHB.push({
                                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                                        dr: checkPayment.balanceUnPaid,
                                        cr: 0,
                                        drcr: checkPayment.balanceUnPaid

                                    }, {
                                        account: acc_principalBefore.accountDoc.code + " | " + acc_principalBefore.accountDoc.name,
                                        dr: 0,
                                        cr: checkPayment.balanceUnPaid,
                                        drcr: -checkPayment.balanceUnPaid
                                    });
                                }
                            }

                        }
                    })

                    if (transactionUSD.length > 0) {

                        let dataForAccount = {};

                        dataForAccount.journalDate = tDate;
                        dataForAccount.branchId = doc.branchId;
                        dataForAccount.voucherId = "0";
                        dataForAccount.currencyId = "USD";
                        dataForAccount.memo = "Adjust Principal USD ";
                        dataForAccount.refId = doc._id;
                        dataForAccount.refFrom = "End Of Process Adjust";
                        dataForAccount.total = totalUSD;
                        dataForAccount.transaction = transactionUSD;

                        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                            if (err) {
                                console.log(err.message);
                            }
                        })
                    }

                    if (transactionKHR.length > 0) {

                        let dataForAccount = {};

                        dataForAccount.journalDate = tDate;
                        dataForAccount.branchId = doc.branchId;
                        dataForAccount.voucherId = "0";
                        dataForAccount.currencyId = "KHR";
                        dataForAccount.memo = "Adjust Principal KHR ";
                        dataForAccount.refId = doc._id;
                        dataForAccount.refFrom = "End Of Process Adjust";
                        dataForAccount.total = totalKHR;
                        dataForAccount.transaction = transactionKHR;
                        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                            if (err) {
                                console.log(err.message);
                            }
                        })
                    }
                    if (transactionTHB.length > 0) {

                        let dataForAccount = {};

                        dataForAccount.journalDate = tDate;
                        dataForAccount.branchId = doc.branchId;
                        dataForAccount.voucherId = "0";
                        dataForAccount.currencyId = "THB";
                        dataForAccount.memo = "Adjust Principal THB ";
                        dataForAccount.refId = doc._id;
                        dataForAccount.refFrom = "End Of Process Adjust";
                        dataForAccount.total = totalTHB;
                        dataForAccount.transaction = transactionTHB;
                        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                            if (err) {
                                console.log(err.message);
                            }
                        })
                    }
                    // console.log(moment(tDate).format("DD/MM/YYYY"));
                }
            })

            //Increment Date
            lastEndOfProcess = moment(lastEndOfProcess).add(1, "days").toDate();


        }
        // console.log("End Of Process " + moment(doc.closeDate).format("DD/MM/YYYY"));

        EndOfProcess.direct.update({_id: doc._id}, {$set: {status: true}}, {multi: true}, function (err) {
            if (err) {
                console.log(err);
            }
        });
    })
})


EndOfProcess.after.remove(function (userId, doc) {

    Meteor.defer(function () {

        //    Integrated to Account========================================================================================================================
        let settingDoc = Setting.findOne();
        if (settingDoc.integrate == true) {
            Meteor.call("api_journalRemove", doc._id, "End Of Process Adjust", function (err, result) {
                if (err) {
                    console.log(err.message);
                }
            })
        }
        //   ========================================================================================================================
    })
})



