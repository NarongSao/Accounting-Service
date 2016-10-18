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
        label: 'Loan ID'
    },
    repaidDate: {
        type: Date,
        label: 'Repaid date',
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
        allowedValues: ['general', 'prepay', 'reschedule', 'waive-interest', 'close']
    },
    amountType: {
        type: String,
        label: 'Amount type',
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
    },
    amountPaid: {
        type: Number,
        label: 'Amount paid',
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
        label: 'Penalty paid',
        decimal: true,
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
});

Repayment.attachSchema(Repayment.schema);
