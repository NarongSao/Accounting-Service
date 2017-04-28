import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import math from 'mathjs';

// Method
import  {lookupProduct} from '../../common/methods/lookup-product.js';
import  {MakeSchedule} from '../../common/methods/make-schedule.js';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';
import {SavingAcc} from '../../common/collections/saving-acc.js';
import {Client} from '../../common/collections/client.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

import {Setting} from '../../../core/common/collections/setting.js';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing.js';

// Before insert
LoanAcc.before.insert(function (userId, doc) {
    let prefix = `${doc.clientId}-${doc.productId}`;
    doc._id = idGenerator2.genWithPrefix(LoanAcc, {
        prefix: prefix,
        length: 3
    });

    // Cal installment allow closing
    let productDoc = lookupProduct.call({_id: doc.productId}),
        penaltyClosingDoc = productDoc.penaltyClosingDoc;

    if (penaltyClosingDoc.installmentType == "P") {
        doc.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * doc.term) / 100);
    } else {
        doc.installmentAllowClosing = penaltyClosingDoc.installmentTermLessThan;
    }

});

// After insert (repayment schedule)
LoanAcc.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        _makeSchedule(doc);
    });

    if (doc.status != "Restructure") {
        Client.direct.update({_id: doc.clientId}, {$inc: {cycle: 1}});
    }

    SavingAcc.direct.update({_id: doc.savingAccId}, {$inc: {savingLoanNumber: 1}})


    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {
        let dataForAccount = {};

        dataForAccount.journalDate = doc.disbursementDate;
        dataForAccount.branchId = doc.branchId;
        dataForAccount.voucherId = doc.voucherId;
        dataForAccount.currencyId = doc.currencyId;
        dataForAccount.memo = "Loan Disbursement";
        dataForAccount.refId = doc._id;
        dataForAccount.refFrom = "Disbursement";
        dataForAccount.total = doc.loanAmount;

        let transaction = [];


        let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
        let acc_principal = checkPrincipal(doc);

        transaction.push({
            account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
            dr: doc.loanAmount,
            cr: 0,
            drcr: doc.loanAmount

        }, {
            account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
            dr: 0,
            cr: doc.loanAmount,
            drcr: -doc.loanAmount
        });

        dataForAccount.transaction = transaction;
        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })


    }


});

// Before update
LoanAcc.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};

    // Cal installment allow closing
    let productDoc = lookupProduct.call({_id: modifier.$set.productId}),
        penaltyClosingDoc = productDoc.penaltyClosingDoc;

    if (penaltyClosingDoc.installmentType == "P") {
        modifier.$set.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * modifier.$set.term) / 100);
    } else {
        modifier.$set.installmentAllowClosing = penaltyClosingDoc.installmentTermLessThan;
    }
});

// After update
LoanAcc.after.update(function (userId, doc, fieldNames, modifier, options) {
    Meteor.defer(function () {
        modifier.$set = modifier.$set || {};
        modifier.$set._id = doc._id;

        RepaymentSchedule.remove({loanAccId: modifier.$set._id});
        _makeSchedule(modifier.$set);
    });

    let loanDoc = this.previous;

    SavingAcc.direct.update({_id: loanDoc.savingAccId}, {$inc: {savingLoanNumber: -1}})
    SavingAcc.direct.update({_id: doc.savingAccId}, {$inc: {savingLoanNumber: 1}})


    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {
        let dataForAccount = {};

        dataForAccount.journalDate = doc.disbursementDate;
        dataForAccount.branchId = doc.branchId;
        dataForAccount.voucherId = doc.voucherId;
        dataForAccount.currencyId = doc.currencyId;
        dataForAccount.memo = "Loan Disbursement";
        dataForAccount.refId = doc._id;
        dataForAccount.refFrom = "Disbursement";
        dataForAccount.total = doc.loanAmount;

        let transaction = [];


        let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
        let acc_principal = checkPrincipal(doc);

        transaction.push({
            account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
            dr: doc.loanAmount,
            cr: 0,
            drcr: doc.loanAmount

        }, {
            account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
            dr: 0,
            cr: doc.loanAmount,
            drcr: -doc.loanAmount
        });

        dataForAccount.transaction = transaction;
        Meteor.call("api_journalUpdate", dataForAccount, function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })


    }

});

// After remove
LoanAcc.after.remove(function (userId, doc) {
    RepaymentSchedule.remove({loanAccId: doc._id});
    if (doc.parentId != 0) {
        let parentDoc = LoanAcc.findOne({_id: doc.parentId});
        if (parentDoc && parentDoc.status == "Restructure") {
            LoanAcc.direct.update({_id: doc.parentId}, {$set: {status: "Active"}, $unset: {restructureDate: ""}});
        }
    }

    if (doc.status != "Restructure") {
        Client.direct.update({_id: doc.clientId}, {$inc: {cycle: -1}});
    }
    SavingAcc.direct.update({_id: doc.savingAccId}, {$inc: {savingLoanNumber: -1}})


    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {

        Meteor.call("api_journalRemove", doc._id, "Disbursement", function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }


});


// Create repayment schedule
function _makeSchedule(doc) {
    let schedule = MakeSchedule.declinig.call({loanAccId: doc._id});

    let maturityDate, tenor = 0, projectInterest = 0, projectFeeOnPayment = 0;

    _.forEach(schedule, (value, key) => {
        tenor += value.numOfDay;
        projectInterest += value.interestDue;
        projectFeeOnPayment += value.feeOnPaymentDue;

        if (key == schedule.length - 1) {
            maturityDate = moment(value.dueDate).startOf("day").toDate();
        }

        // Save to repayment schedule collection


        value.scheduleDate = moment(doc.disbursementDate, "DD/MM/YYYY").startOf("day").toDate();
        value.loanAccId = doc._id;
        value.savingAccId = doc.savingAccId;
        value.branchId = doc.branchId;


        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on loan acc
    LoanAcc.direct.update({_id: doc._id}, {
        $set: {
            maturityDate: maturityDate,
            tenor: tenor,
            projectInterest: projectInterest,
            projectFeeOnPayment: projectFeeOnPayment
        }
    });
}


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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Less than or Equal One Year"});
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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Over One Year"});
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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Less than or Equal One Year"});
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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Over One Year"});
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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Less than or Equal One Year"});
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
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Over One Year"});
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
            acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party External Auditors Over One Year"});

        } else if (doc.accountType == "RPSL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Shareholder Over One Year"});

        } else if (doc.accountType == "RPML") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Standard Loan Related Party Manager Over One Year"});

        } else if (doc.accountType == "RPEL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "	Standard Loan Related Party Employees Over One Year"});
        }
    }
    return acc_principal;
}
