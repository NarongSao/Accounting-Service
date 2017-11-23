import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Method
import  {lookupProduct} from './lookup-product.js';

// Collection
import {SavingAcc} from '../../common/collections/saving-acc';

export const lookupSavingAcc = new ValidatedMethod({
    name: 'microfis.lookupSavingAcc',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        savingAccId: {type: String}
    }).validator(),
    run({savingAccId}) {
        if (!this.isSimulation) {
            this.unblock();

            let data = SavingAcc.aggregate([
                {$match: {_id: savingAccId}},
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
                        from: "microfis_savingProduct",
                        localField: "productId",
                        foreignField: "_id",
                        as: "productDoc"
                    }
                },
                {$unwind: "$productDoc"},
            ])[0];

            return data;
        }
    }
});