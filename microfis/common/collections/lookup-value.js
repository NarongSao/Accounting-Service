import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const LookupValue = new Mongo.Collection("microfis_lookupValue");

LookupValue.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
    },
    private: {
        type: Boolean,
        defaultValue: false,
        autoform: {
            type: "boolean-checkbox"
        }
    },
    options: {
        type: Array,
        minCount: 1
    },
    'options.$': {
        type: Object
    },
    'options.$.value': {
        type: String,
        max: 100
    },
    'options.$.label': {
        type: String,
        max: 250
    },
    'options.$.order': {
        type: Number,
        min: 0
    }
});

LookupValue.attachSchema(LookupValue.schema);
