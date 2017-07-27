import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Setting = new Mongo.Collection("microfis_setting");

Setting.schema = new SimpleSchema({
    dayOfWeekToEscape: {
        type: [Number],
        optional: true,
        defaultValue: [],
        autoform: {
            type: "select-multiple",

            // multiple: true,
            options: function () {
                return SelectOpts.dayOfWeekToEscape(false);
            }
        }
    },
    dayOfRates: {
        type: Object,
        label: 'Day of rates'
    },
    'dayOfRates.weekly': {
        type: Number,
        label: 'Weekly',
        defaultValue: 7,
        min: 5,
        max: 7,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: '5 - 7',
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    'dayOfRates.monthly': {
        type: Number,
        label: 'Monthly',
        defaultValue: 30,
        min: 28,
        max: 31,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: '28 - 30',
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    'dayOfRates.yearly': {
        type: Number,
        label: 'Yearly',
        defaultValue: 365,
        min: 365,
        max: 366,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: '365 - 366',
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    writeOffDay: {
        type: Number,
        label: "Write Off (Days)"
    }
});

Setting.attachSchema(Setting.schema);
