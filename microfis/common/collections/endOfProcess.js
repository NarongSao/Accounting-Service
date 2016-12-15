import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const EndOfProcess = new Mongo.Collection("microfis_endOfProcess");

EndOfProcess.schema = new SimpleSchema({
    closeDate: {
        type: Date,
        label: "Date",

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
    branchId: {
        type: String,
        label: "Branch"
    },
    month: {
        type: String,
        optional: true
    },
    year: {
        type: String,
        optional: true
    },
    day: {
        type: String,
        optional: true
    },
    detailPaid: {
        type: [Object],
        optional: true,
        blackbox: true
    }
});

EndOfProcess.attachSchema(EndOfProcess.schema);
