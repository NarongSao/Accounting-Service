import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const LookupValue = new Mongo.Collection("microfis_lookupValue");

LookupValue.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
    },
    private: {
        type: String,
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'true',
            options: function () {
                return [
                    {label: 'True', value: 'true'},
                    {label: 'False', value: 'false'}
                ];
            }
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
    'options.$.index': {
        type: Number
    }
});

LookupValue.attachSchema(LookupValue.schema);
