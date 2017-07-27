import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Client = new Mongo.Collection("microfis_client");

Client.generalSchema = new SimpleSchema({
    prefix: {
        type: String,
        label: 'Prefix',
        optional: true,
        autoform: {
            // type: 'select',
            type: "hidden",
            afFieldInput: {
                options: function () {
                    return SelectOpts.prefix(false);
                }
            }
        }
    },
    khSurname: {
        type: String,
        label: 'Kh surname',
        max: 250
    },
    khGivenName: {
        type: String,
        label: 'Kh given name',
        max: 250
    },
    khNickname: {
        type: String,
        label: 'Kh nickname',
        max: 150,
        optional: true
    },
    enSurname: {
        type: String,
        label: 'En surname',
        max: 250,
        optional: true
    },
    enGivenName: {
        type: String,
        label: 'En given name',
        max: 250,
        optional: true
    },
    enNickname: {
        type: String,
        label: 'En nickname',
        max: 150,
        optional: true
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
        defaultValue: moment().add(-18, "years").toDate(),
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
    maritalStatus: {
        type: String,
        label: 'Marital status',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return SelectOpts.maritalStatus(false);
                }
            }
        }
    },
    photo: {
        type: String,
        label: 'Photo',
        autoform: {
            afFieldInput: {
                type: 'fileUpload',
                collection: 'Files',
                accept: 'image/*'
            }
        },
        optional: true
    },
    branchId: {
        type: String
    },
    cycle: {
        type: Number,
        defaultValue: 0,
        optional: true
    }
});

// ID Type
Client.idTypeSchema = new SimpleSchema({
    idType: {
        type: String,
        label: 'ID type',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return SelectOpts.idType(false);
                }
            }
        }
    },
    idNumber: {
        type: String,
        label: 'ID number',
        max: 100,
        defaultValue: "",
        optional: true,
        custom: function () {
            if (Meteor.isClient) {
                let idType = this.field('idType').value;

                if (idType == 'N') {
                    let checkIdNumber = false;
                    if (this.value) {
                        let lengthValue = this.value.length;
                        checkIdNumber = (lengthValue == 9 || lengthValue == 10) ? true : false;
                    }

                    if (!checkIdNumber) {
                        return 'idNumberForNationalType';
                    }
                }
            }
        }
    },
    idExpiryDate: {
        type: Date,
        label: 'ID expiry date',
        defaultValue: moment().toDate(),
        optional: true,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        },
        custom: function () {
            if (Meteor.isClient) {
                let idType = this.field('idType').value;
                let idExpiryDate = AutoForm.getFieldValue('idExpiryDate');

                if ((idType == 'N' || idType == 'P' || idType == 'D') && !idExpiryDate) {
                    return 'idExpiryDateIsRequired';
                }
            }
        }
    },
    uniqueByCondition: {
        type: Number,
        defaultValue: 0,
        optional: true
    }
});

// Contact
Client.contactSchema = new SimpleSchema({
    address: {
        type: String,
        label: 'Address',
        optional: true,
        defaultValue: "",
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
        defaultValue: "",
        max: 100,
        optional: true
    }
});

// Other
// Client.otherSchema = new SimpleSchema({
//     education: {
//         type: Number,
//         label: 'Education',
//         autoform: {
//             type: 'select',
//             afFieldInput: {
//                 options: function () {
//                     return lookupValue('Education', {selectOne: false});
//                 }
//             }
//         }
//     },
//     Occupation: {
//         type: String,
//         label: 'Occupation',
//         autoform: {
//             type: 'select',
//             afFieldInput: {
//                 options: function () {
//                     return lookupValue('Occupation', {selectOne: false});
//                 }
//             }
//         }
//     },
//     dependents: {
//         type: Object,
//         label: 'Dependents'
//     },
//     'dependents.children': {
//         type: Number,
//         label: 'Children'
//     },
//     'dependents.other': {
//         type: Number,
//         label: 'Other'
//     },
// });

Client.attachSchema([
    Client.generalSchema,
    Client.idTypeSchema,
    Client.contactSchema
]);

// Custom validate
SimpleSchema.messages({
    idNumberForNationalType: '[label] is required and must be 9 digits for "N" ID type',
    idExpiryDateIsRequired: '[label] is required for "N, P and D" ID type '
});
