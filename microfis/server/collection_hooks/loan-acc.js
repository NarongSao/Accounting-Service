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

    doc.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * doc.term) / 100);

});

// After insert (repayment schedule)
LoanAcc.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        _makeSchedule(doc);
    });

    if (doc.status != "Restructure") {
        Client.direct.update({_id: doc.clientId}, {$inc: {cycle: 1}});
    }

});

// Before update
LoanAcc.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};

    // Cal installment allow closing
    let productDoc = lookupProduct.call({_id: modifier.$set.productId}),
        penaltyClosingDoc = productDoc.penaltyClosingDoc;

    modifier.$set.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * modifier.$set.term) / 100);

});

// After update
LoanAcc.after.update(function (userId, doc, fieldNames, modifier, options) {
    Meteor.defer(function () {
        modifier.$set = modifier.$set || {};
        modifier.$set._id = doc._id;

        RepaymentSchedule.remove({loanAccId: modifier.$set._id});
        _makeSchedule(modifier.$set);
    });
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
});

// Create repayment schedule
function _makeSchedule(doc) {
    let schedule = MakeSchedule.declinig.call({loanAccId: doc._id});

    let maturityDate, tenor = 0, projectInterest = 0;

    _.forEach(schedule, (value, key) => {
        tenor += value.numOfDay;
        projectInterest += value.interestDue;

        if (key == schedule.length - 1) {
            maturityDate = moment(value.dueDate, "DD/MM/YYYY").toDate();
        }

        // Save to repayment schedule collection


        value.scheduleDate = moment(doc.disbursementDate, "DD/MM/YYYY").toDate();
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
            projectInterest: projectInterest
        }
    });
}