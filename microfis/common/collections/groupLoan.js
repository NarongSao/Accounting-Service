import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const GroupLoan = new Mongo.Collection("microfis_groupLoan");

GroupLoan.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        // unique: true,
        max: 250
    },
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
    }
    ,
    code: {
        type: String,
        label: 'Code'
    },
    branchId: {
        type: String
    },
    loan: {
        type: Array,
        optional: true
    },
    'loan.$': {
        type: Object
    },
    'loan.$.id': {
        type: String,
        label: "Loan Account"
    },
    'loan.$.status': {
        type: Boolean,
        label: "Status",
        optional: true,
        defaultValue: true
    }
});

GroupLoan.groupLoanDetail = new SimpleSchema({
    loanAccount: {
        type: String,
        label: "Loan Account"
    }
});

GroupLoan.attachSchema(GroupLoan.schema);
