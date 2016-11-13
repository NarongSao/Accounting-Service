import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const PenaltyClosing = new Mongo.Collection("microfis_penaltyClosing");

PenaltyClosing.schema = new SimpleSchema({
    name: {
        type: String,
        label:'Name',
        unique: true,
        max: 250
    },
    installmentTermLessThan: {
        type: Number,
        label: 'Installment term less than (%)',
        min: 0,
        max: 100
    },
    interestRemainderCharge: {
        type: Number,
        label: 'Interest remainder charge (%)',
        min: 0,
        max: 100
    }
});

PenaltyClosing.attachSchema(PenaltyClosing.schema);
