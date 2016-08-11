import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Method
import  {lookupProduct} from './lookup-product.js';

// Collection
import {Disbursement} from '../../imports/api/collections/disbursement.js';

export const lookupDisbursement = new ValidatedMethod({
    name: 'microfis.lookupDisbursement',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);
            
            let data = Disbursement.aggregate([
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
            ])[0];

            // Get product lookup
            data.productDoc = lookupProduct.call({_id: data.productId});

            return data;
        }
    }
});