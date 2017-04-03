import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {ChangeCO} from '../../common/collections/changeCO';
import {CreditOfficer} from '../../common/collections/credit-officer';
import {LoanAcc} from '../../common/collections/loan-acc';

ChangeCO.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-' + moment(doc.date).format("YYYY");
    doc._id = idGenerator2.genWithPrefix(ChangeCO, {
        prefix: prefix,
        length: 6
    });

    doc.fromCODoc = CreditOfficer.findOne(doc.fromCO);
    doc.toCODoc = CreditOfficer.findOne(doc.toCO);

    let locationList = [];
    doc.location.forEach(function (obj) {
        locationList.push(obj.locationId);
    })
    LoanAcc.direct.update({
        locationId: {$in: locationList}, creditOfficerId: doc.fromCO,
        status: {$ne: "Close"}
    }, {
        $set: {
            changeCOId: doc._id,
            creditOfficerId: doc.toCO
        },
        $inc: {
            transferNumber: 1
        }
    }, {multi: true});

});

ChangeCO.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};

    modifier.$set.fromCODoc = CreditOfficer.findOne(modifier.$set.fromCO);
    modifier.$set.toCODoc = CreditOfficer.findOne(modifier.$set.toCO);


    let locationPreviousList = [];
    doc.location.forEach(function (obj) {
        locationPreviousList.push(obj.locationId);
    })

    LoanAcc.direct.update({
        locationId: {$in: locationPreviousList},
        creditOfficerId: doc.toCO,
        changeCOId: doc._id,
        status: {$ne: "Close"}
    }, {
        $set: {creditOfficerId: doc.fromCO, changeCOId: ""},
        $inc: {
            transferNumber: -1
        }
    }, {multi: true});

    let locationList = [];
    modifier.$set.location.forEach(function (obj) {
        locationList.push(obj.locationId);
    })

    LoanAcc.direct.update({
        locationId: {$in: locationList}, creditOfficerId: modifier.$set.fromCO,
        status: {$ne: "Close"}
    }, {
        $set: {
            changeCOId: doc._id,
            creditOfficerId: modifier.$set.toCO
        },
        $inc: {
            transferNumber: 1
        }
    }, {multi: true});

})

ChangeCO.before.remove(function (userId, doc) {
    let locationList = [];
    doc.location.forEach(function (obj) {
        locationList.push(obj.locationId);
    })

    LoanAcc.direct.update({
        locationId: {$in: locationList}, creditOfficerId: doc.toCO, changeCOId: doc._id,
        status: {$ne: "Close"}
    }, {
        $set: {creditOfficerId: doc.fromCO, changeCOId: ""},
        $inc: {
            transferNumber: -1
        }
    }, {multi: true});
})
