import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Product} from '../../common/collections/product.js';

export const lookupProduct = new ValidatedMethod({
    name: 'microfis.lookupProduct',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            this.unblock();
            let data = Product.aggregate([
                {$match: {_id: _id}},
                /*{
                    $lookup: {
                        from: "microfis_fee",
                        localField: "feeId",
                        foreignField: "_id",
                        as: "feeDoc"
                    }
                },
                {$unwind: "$feeDoc"},*/
                {
                    $lookup: {
                        from: "microfis_penalty",
                        localField: "penaltyId",
                        foreignField: "_id",
                        as: "penaltyDoc"
                    }
                },
                {$unwind: "$penaltyDoc"},
                {
                    $lookup: {
                        from: "microfis_penaltyClosing",
                        localField: "penaltyClosingId",
                        foreignField: "_id",
                        as: "penaltyClosingDoc"
                    }
                },
                {$unwind: "$penaltyClosingDoc"}
            ]);
            return data[0];
        }
    }
});

// export const lookupProduct = new ValidatedMethod({
//     name: 'microfis.lookupProduct',
//     mixins: [CallPromiseMixin],
//     validate: new SimpleSchema({
//         _id: {type: String}
//     }).validator(),
//     run({_id}) {
//         if (!this.isSimulation) {
//             let data = Product.aggregate([
//                 {$match: {_id: _id}},
//                 {
//                     $lookup: {
//                         from: "microfis_fee",
//                         localField: "feeId",
//                         foreignField: "_id",
//                         as: "feeDoc"
//                     }
//                 },
//                 {$unwind: "$feeDoc"},
//                 {
//                     $lookup: {
//                         from: "microfis_penalty",
//                         localField: "penaltyId",
//                         foreignField: "_id",
//                         as: "penaltyDoc"
//                     }
//                 },
//                 {$unwind: "$penaltyDoc"},
//                 {
//                     $lookup: {
//                         from: "microfis_penaltyClosing",
//                         localField: "penaltyClosingId",
//                         foreignField: "_id",
//                         as: "penaltyClosingDoc"
//                     }
//                 },
//                 {$unwind: "$penaltyClosingDoc"},
//                 {$unwind: '$fundId'},
//                 {
//                     $lookup: {
//                         from: "microfis_fund",
//                         localField: "fundId",
//                         foreignField: "_id",
//                         as: "fundDoc"
//                     }
//                 },
//                 {$unwind: "$fundDoc"},
//                 {
//                     $group: {
//                         _id: '$_id',
//                         data: {
//                             $first: "$$ROOT"
//                         },
//                         fundDoc: {
//                             $addToSet: '$fundDoc'
//                         }
//                     }
//                 },
//                 {$unwind: "$data"}
//             ]);
//
//             return data[0];
//         }
//     }
// });