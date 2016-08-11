import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import math from 'mathjs';

// Method
import  {lookupProduct} from '../../common/methods/lookup-product.js';
import  {MakeSchedule} from '../../common/methods/make-schedule.js';

// Collection
import {Disbursement} from '../../imports/api/collections/disbursement.js';
import {RepaymentSchedule} from '../../imports/api/collections/repayment-schedule.js';

// Before insert
Disbursement.before.insert(function (userId, doc) {
    let prefix = `${doc.clientId}-${doc.productId}`;
    doc._id = idGenerator2.genWithPrefix(Disbursement, {
        prefix: prefix,
        length: 3
    });

    // Cal installment allow closing
    let productDoc = lookupProduct.call({_id: doc.productId}),
        penaltyClosingDoc = productDoc.penaltyClosingDoc;

    doc.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * doc.term) / 100);

});

// After insert (repayment schedule)
Disbursement.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        _makeSchedule(doc);
    });
});

// Before update
Disbursement.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};

    // Cal installment allow closing
    let productDoc = lookupProduct.call({_id: modifier.$set.productId}),
        penaltyClosingDoc = productDoc.penaltyClosingDoc;

    modifier.$set.installmentAllowClosing = math.ceil((penaltyClosingDoc.installmentTermLessThan * modifier.$set.term) / 100);

});

// After update
Disbursement.after.update(function (userId, doc, fieldNames, modifier, options) {
    Meteor.defer(function () {
        modifier.$set = modifier.$set || {};
        modifier.$set._id = doc._id;

        RepaymentSchedule.remove({disbursementId: modifier.$set._id});
        _makeSchedule(modifier.$set);
    });
});

// After remove
Disbursement.after.remove(function (userId, doc) {
    RepaymentSchedule.remove({disbursementId: doc._id});
});

// Create repayment schedule
function _makeSchedule(doc) {
    let schedule = MakeSchedule.declinig.call({disbursementId: doc._id});

    let maturityDate, tenor = 0;

    _.forEach(schedule, (value, key)=> {
        tenor += value.numOfDay;
        if (key == schedule.length - 1) {
            maturityDate = value.dueDate;
        }

        // Save to repayment schedule collection
        value.scheduleDate = doc.disbursementDate;
        value.disbursementId = doc._id;
        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on disbursement
    Disbursement.direct.update({_id: doc._id}, {$set: {maturityDate: maturityDate, tenor: tenor}});
}