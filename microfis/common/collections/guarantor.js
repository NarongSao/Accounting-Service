import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Guarantor = new Mongo.Collection("microfis_guarantor");

Guarantor.schema = new SimpleSchema({
    khName: {
        type: String,
        label: 'Kh name',
        max: 250
    },
    enName: {
        type: String,
        label: 'En name',
        max: 250
    },
    gender: {
        type: String,
        label: 'Gender',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return SelectOpts.gender(false);
                }
            }
        }
    },
    dob: {
        type: Date,
        label: 'Date of birth',
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
        label: 'Address',
        max: 500
    },
    telephone: {
        type: String,
        label: 'Telephone',
        max: 100,
        optional: true
    },
    email: {
        type: String,
        label: 'Email',
        regEx: SimpleSchema.RegEx.Email,
        max: 100,
        optional: true
    },
    photo: {
        type: String,
        label: 'Photo',
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'fileUpload',
                collection: 'Files',
                accept: 'image/*'
            }
        }
    },
    branchId: {
        type: String
    }
});

Guarantor.attachSchema(Guarantor.schema);
