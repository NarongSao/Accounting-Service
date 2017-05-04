import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Fee = new Mongo.Collection("microfis_fee");

Fee.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
    }
    ,
    calculateType: {
        type: String,
        label: 'Calculate type',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'A',
            options: function () {
                return SelectOpts.calculateType(false);
            }
        }
    },
    feeTypeOf: {
        type: String,
        label: 'Fee Type Of',
        optional: true,
        autoform: {
            type: "select2",
            defaultValue: 'Disbursement',
            options: function () {
                let feeTypeOf = [];
                feeTypeOf.push(
                    {label: "Disbursement", value: "Disbursement"},
                    {label: "Loan Outstanding", value: "Loan Outstanding"},
                    {label: "Amount Due", value: "Amount Due"},
                    {label: "Interest Due", value: "Interest Due"},
                    {label: "Principal Due", value: "Principal Due"}
                )
                return feeTypeOf;
            }
        }
    },
    amount: {
        type: Number,
        label: function () {
            if (Meteor.isClient) {
                let labelType = '';
                let calculateType = AutoForm.getFieldValue('calculateType');
                if (calculateType == 'A') {
                    labelType = '(USD)';
                } else if (calculateType == 'P') {
                    labelType = '(%)';
                }
                return 'Amount ' + labelType;
            }
        },
        decimal: true,
        min: 0,
        autoform: {
            type: "inputmask",
            defaultValue: 'A',
            afFieldInput: {
                inputmaskOptions: function () {
                    if (Meteor.isClient) {
                        let calculateType = AutoForm.getFieldValue('calculateType');
                        if (calculateType == 'P') {
                            return inputmaskOptions.decimal();
                        }
                        return inputmaskOptions.currency();
                    }
                }
            }
        }
    }
});

Fee.attachSchema(Fee.schema);
