import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Disbursement} from '../../imports/api/collections/disbursement.js';

Meteor.publish('microfis.disbursementById', function microfisDisbursementById(disbursementId) {
    this.unblock();

    new SimpleSchema({
        disbursementId: {type: String},
    }).validate({disbursementId});

    if (!this.userId) {
        return this.ready();
    }
    Meteor._sleepForMs(100);

    return Disbursement.find({_id: disbursementId});
});

// Publish aggregate
Meteor.publish("microfis.disbursementAggregateById", function microfisDisbursementAggregate(_id) {
    this.unblock();

    new SimpleSchema({
        _id: {type: String},
    }).validate({_id});

    ReactiveAggregate(this, Disbursement, [
        {$match: {_id: _id}},
        {
            $lookup: {
                from: "microfis_client",
                localField: "clientId",
                foreignField: "_id",
                as: "clientDoc"
            }
        },
        {$unwind: "$clientDoc"},
        {
            $lookup: {
                from: "microfis_fund",
                localField: "fundId",
                foreignField: "_id",
                as: "fundDoc"
            }
        },
        {$unwind: "$fundDoc"},
        {
            $lookup: {
                from: "microfis_creditOfficer",
                localField: "creditOfficerId",
                foreignField: "_id",
                as: "creditOfficerDoc"
            }
        },
        {$unwind: "$creditOfficerDoc"},
        {
            $lookup: {
                from: "microfis_location",
                localField: "locationId",
                foreignField: "_id",
                as: "locationDoc"
            }
        },
        {$unwind: "$locationDoc"}
    ], {clientCollection: "clientDisbursement"});
});