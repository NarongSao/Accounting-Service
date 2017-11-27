import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {SavingProduct} from '../../common/collections/saving-product.js';

export const lookupSavingProduct = new ValidatedMethod({
    name: 'microfis.lookupSavingProduct',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {

            let data = SavingProduct.aggregate([
                {$match: {_id: _id}},
                {
                    $lookup: {
                        from: "microfis_fee",
                        localField: "feeId",
                        foreignField: "_id",
                        as: "feeDoc"
                    }
                },
                {$unwind: "$feeDoc"},
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
