import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import moment from 'moment';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {SavingSelectOptMethods} from '../methods/saving-select-opts.js';

let state = new ReactiveDict();

// Tracker
if (Meteor.isClient) {
    Tracker.autorun(function () {
        let savingAccDoc = Session.get('savingAccDoc');

        if (savingAccDoc) {
            state.set('currencyId', savingAccDoc.currencyId);
        }
    });
}

export const SavingTransaction = new Mongo.Collection("microfis_savingTransaction");

// General
SavingTransaction.generalSchema = new SimpleSchema({
    savingAccId: {
        type: String
    },
    transactionDate: {
        type: Date,
        label: "Transaction Date",
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        },
    },
    amount: {
        type: Number,
        label: 'Amount',
        decimal: true,
        min: function () {
            if (Meteor.isClient) {
                return Session.get('minAmount');
            }
        },
        max: function () {
            if (Meteor.isClient) {
                return Session.get('maxAmount');
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                inputmaskOptions: function () {
                    if (Meteor.isClient) {
                        let prefix = '';
                        let currencyId = state.get('currencyId');

                        if (currencyId == 'KHR') {
                            prefix = '៛ ';
                        } else if (currencyId == 'USD') {
                            prefix = '$ ';
                        } else if (currencyId == 'THB') {
                            prefix = 'B ';
                        }

                        return inputmaskOptions.currency({prefix: prefix})
                    }
                }
            }
        }
    },
    transactionType: {
        type: String,
        label: 'Transaction type',
        allowedValues: ['CD', 'CW', 'LD', 'LR']
        // autoform: {
        //     type: 'select',
        //     afFieldInput: {
        //         options: function () {
        //             return [
        //                 {label: 'Cash Deposit', value: 'CD'},
        //                 {label: 'Cash Withdrawal', value: 'CW'},
        //                 {label: 'Loan Disbursement', value: 'LD'},
        //                 {label: 'Loan Repayment', value: 'LR'},
        //             ];
        //         }
        //     }
        // }
    },
    status: {
        type: String,
        optional: true
    },
    voucherId: {
        type: String,
    },
    memo: {
        type: String,
        label: 'Memo',
        optional: true,
        autoform: {
            afFieldInput: {
                rows: 3
            }
        }
    },
    details: {
        type: Object, // tax, offset interest for term, penalty for term closing
        optional: true,
        blackbox: true
    },
    branchId: {
        type: String
    }
});

SavingTransaction.attachSchema([
    SavingTransaction.generalSchema
]);

// Custom validate
SimpleSchema.messages({
    "performDateIsGte": "[label] must be granter than or equal the last doc",
    "voucherIdIsUnique": "[label] is unique"
});
