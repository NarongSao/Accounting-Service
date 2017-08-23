import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const GroupLoan = new Mongo.Collection("microfis_groupLoan");

GroupLoan.schema = new SimpleSchema({
    groupId: {
        type: String,
        label: 'Group',
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.groupOpt(Session.get("currentBranch"));
            }
        }
    },
    groupName: {
        type: String,
        optional: true
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
        label: "Loan Id"
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
        optional: true,
        label: "Loan Account"
    }
});

GroupLoan.attachSchema(GroupLoan.schema);
