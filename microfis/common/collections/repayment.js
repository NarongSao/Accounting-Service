import {Mongo} from 'meteor/mongo';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Tracker} from 'meteor/tracker';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../methods/select-opts.js';

export const Repayment = new Mongo.Collection("microfis_repayment");

Repayment.schema = new SimpleSchema({
    loanAccId: {
        type: String,
        label: 'Loan ID',
        index: true
    },
    repaidDate: {
        type: Date,
        label: 'Repayment date',
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true,
                    maxDate: moment().toDate()
                }
            }
        },
    },
    type: {
        type: String,
        label: 'Type',
        allowedValues: ['General', 'Prepay', 'Reschedule', 'Waive-interest', 'Close', 'Restructure', 'Write Off', "Fee"]
    },
    /*amountType: {
        type: String,
        label: 'Payment By',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'CA',
            options: function () {
                return [
                    {label: 'Cash', value: 'CA'},
                    {label: 'Saving Acc', value: 'SA'}
                ];
            }
        }
    },*/
    amountPaid: {
        type: Number,
        label: 'Amount',
        decimal: true,
        min: function () {
            if (Meteor.isClient) {
                let amount = Session.get('minAmountPaid');
                return amount;
            }
        },
        max: function () {
            if (Meteor.isClient) {
                let amount = Session.get('maxAmountPaid');
                return amount;
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                // placeholder: '',
                inputmaskOptions: function () {
                    return inputmaskOptions.currency({prefix: ''})
                }
            }
        }
    },
    penaltyPaid: {
        type: Number,
        label: 'Penalty Amount',
        decimal: true,
        optional: true,
        defaultValue: 0,
        min: 0,
        max: function () {
            if (Meteor.isClient) {
                let amount = Session.get('maxPenaltyPaid');
                return amount;
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                // placeholder: '',
                inputmaskOptions: function () {
                    return inputmaskOptions.currency({prefix: ''})
                }
            }
        }
    },
    waivedForClosing: {
        type: Number,
        decimal: true,
        defaultValue:0,
        optional: true
    },
    totalPaid: {
        type: Number,
        decimal: true,
        optional: true
    },
    note: {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                rows: 4
            }
        }
    },
    detailDoc: {
        type: Object,
        label: 'Repaid doc',
        optional: true,
        blackbox: true
    },
    branchId: {
        type: String,
        label: "Branch",
        optional: true
    },
    voucherId: {
        type: String,
        label: "Voucher"
    },
    currencyId: {
        type: String,
        label: "Currency",
        optional: true
    },
    endId: {
        type: String,
        defaultValue: "0"
    },
    savingBalance: {
        type: Number,
        decimal: true,
        defaultValue: 0
    }
});

Repayment.QuickPay = new SimpleSchema({
    clientAccId: {
        type: String,
        label: "Client Account Id"
    },
    paymentType: {
        type: String,
        label: "Payment Type",
        defaultValue: "",
        autoform: {
            type: "select2",
        }
    }
})

Repayment.attachSchema(Repayment.schema);
