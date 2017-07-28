import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const PaymentStatus = new Mongo.Collection("microfis_paymentStatus");

PaymentStatus.schema = new SimpleSchema({
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
    name: {
        type: String,
        label: 'Name',
        max: 250
    },
    code: {
        type: String,
        optional: true
    }
});

PaymentStatus.attachSchema(PaymentStatus.schema);

SimpleSchema.messages({
    cusMinDay: '[label] must be greater than [From]'
});
