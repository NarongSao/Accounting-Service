import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const ChangeCO = new Mongo.Collection("microfis_changeCO");

ChangeCO.schema = new SimpleSchema({
    date: {
        type: Date,
        label: 'Create date',
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }
    },
    fromCO: {
        type: String
    },
    toCO: {
        type: String
    },

    branchId: {
        type: String
    },
    location: {
        type: Array,
        optional: true
    },
    'location.$': {
        type: Object
    },
    'location.$.id': {
        type: String,
        label: "Location"
    }
});

ChangeCO.groupLoanDetail = new SimpleSchema({
    locationId: {
        type: String,
        label: "Location"
    }
});

ChangeCO.attachSchema(ChangeCO.schema);
