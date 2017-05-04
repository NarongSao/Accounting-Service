import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {SelectOptsReport} from '../../imports/libs/select-opts.js';


export const ChangeCO = new Mongo.Collection("microfis_changeCO");

ChangeCO.schema = new SimpleSchema({
    date: {
        type: Date,
        label: 'Transfer date',
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
        type: String,
        label: 'From CO',
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.creditOfficer(Session.get("currentBranch"));
            }
        }
    },
    fromCODOc: {
        type: Object,
        optional: true
    },
    toCO: {
        type: String,
        label: 'To CO',
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.creditOfficer(Session.get("currentBranch"));
            }
        }
    },
    toCODOc: {
        type: Object,
        optional: true
    },
    branchId: {
        type: String
    },
    description: {
        type: String,
        optional: true
    },
    location: {
        type: Array,
        optional: true
    },
    'location.$': {
        type: Object
    },
    'location.$.locationId': {
        type: String,
        label: "Location"
    },
    'location.$.locationName': {
        type: String,
        optional: true
    }
});

ChangeCO.changeCODetail = new SimpleSchema({
    locationId: {
        type: String,
        label: "Location"
    },
    locationName: {
        type: String,
        label: "Location Name"
    }
});

ChangeCO.attachSchema(ChangeCO.schema);
