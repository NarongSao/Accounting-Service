import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Fund = new Mongo.Collection("microfis_fund");

Fund.schema = new SimpleSchema({
    name: {
        type: String,
        label:'Name',
        unique: true,
        max: 250
    }, 
    shortName: {
        type: String,
        label:'Short name',
        unique: true,
        max: 150
    },
    registerDate: {
        type: Date,
        label:'Register date',
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
    address: {
        type: String,
        label:'Address',
        max: 500
    },
    telephone: {
        type: String,
        label:'Telephone',
        max: 50,
        optional: true
    },
    email: {
        type: String,
        label:'Email',
        regEx: SimpleSchema.RegEx.Email,
        max: 50,
        optional: true
    },
    website: {
        type: String,
        label:'Website',
        regEx: SimpleSchema.RegEx.Domain,
        max: 50,
        optional: true
    }
});

Fund.attachSchema(Fund.schema);
