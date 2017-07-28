import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const ProductStatus = new Mongo.Collection("microfis_productStatus");

ProductStatus.schema = new SimpleSchema({
    from: {
        type: Number,
        label: 'From'
    },
    to: {
        type: Number,
        label: 'To',
        optional: true,
        custom: function () {
            let from = this.field('from').value;
            let to = this.value;
            if (from > to) {
                return 'cusMinDay';
            }
        }
    },
    type: {
        type: String,
        label: "Type"
    },
    name: {
        type: String,
        label: 'Name',
        max: 250
    },
    code: {
        type: String,
        optional: true
    },
    provision: {
        type: Number,
        decimal: true,
        label: "Provision(%)",
        autoform: {
            type: "inputmask",
            afFieldInput: {
                // placeholder: '',
                inputmaskOptions: function () {
                    return inputmaskOptions.percentage()
                }
            }
        }
    }
});

ProductStatus.attachSchema(ProductStatus.schema);

SimpleSchema.messages({
    cusMinDay: '[label] must be greater than [From]'
});
