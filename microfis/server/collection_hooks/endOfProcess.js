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


EndOfProcess.before.insert(function (userId, doc) {
    let date = moment(doc.closeDate, "DD/MM/YYYY").format("YYMM");
    let prefix = doc.branchId + "-" + date;
    doc._id = idGenerator.genWithPrefix(EndOfProcess, prefix, 6);
    doc.month = moment(doc.closeDate, "DD/MM/YYYY").format("MM");
    doc.day = moment(doc.closeDate, "DD/MM/YYYY").format("DD");
    doc.year = moment(doc.closeDate, "DD/MM/YYYY").format("YYYY");


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

                        let acc_principalBefore = checkPrincipalAdjustBalance(obj, proStatusBefore._id);
                        let acc_principal = checkPrincipalAdjustBalance(obj, proStatus._id);


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
        }
        //Increment Date
        lastEndOfProcess = moment(lastEndOfProcess).add(1, "days").toDate();
    }

});

/*
 EndOfProcess.after.insert(function (userId, doc) {
 Meteor.defer(function () {
 let settingDoc = Setting.findOne();
 let lastEndOfProcessList = EndOfProcess.find({
 branchId: doc.branchId,
 _id: {$ne: doc._id}
 }, {sort: {closeDate: -1}, limit: 1}).fetch();

 let i = 0;
 let lastEndOfProcess = lastEndOfProcessList[0].closeDate == undefined ? doc.closeDate : lastEndOfProcessList[0].closeDate;
 while (lastEndOfProcess.getTime() <= moment(doc.closeDate).endOf("days").toDate().getTime()) {
 let tDate = moment(lastEndOfProcess).endOf('day').toDate();


 //    Adjust Principal Balance
 //    Integrated to Account========================================================================================================================
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

 let acc_principalBefore = checkPrincipalAdjustBalance(obj, proStatusBefore._id);
 let acc_principal = checkPrincipalAdjustBalance(obj, proStatus._id);


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
 }

 //Increment Date
 lastEndOfProcess = moment(lastEndOfProcess).add(1, "days").toDate();
 }
 //    ========================================================================================================================
 })
 })
 */

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


let checkPrincipal = function (doc) {

    let acc_principal = {}


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


    return acc_principal;
}


let checkInterest = function (doc) {

    let acc_interest = {}


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


    return acc_interest;
}

let checkPrincipalAdjustBalance = function (doc, loanType) {

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

