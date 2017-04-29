import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const PenaltyClosing = new Mongo.Collection("microfis_penaltyClosing");

PenaltyClosing.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
    },
    installmentType: {
        type: String,
        label: 'Installment Type',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'A',
            options: function () {
                return SelectOpts.calculateType(false);
            }
        }
    },
    installmentTermLessThan: {
        type: Number,
        label: function () {
            if (Meteor.isClient) {
                let labelType = 'Installment term less than';
                let installmentType = AutoForm.getFieldValue('installmentType');
                if (installmentType == 'P') {
                    labelType = 'Installment term less than (%)';
                }
                return labelType;
            }
        },
        min: 0,
        max: function () {
            if (Meteor.isClient) {
                let installmentType = AutoForm.getFieldValue('installmentType');
                if (installmentType == 'P') {
                    return 100;
                }
            }
        }
    },
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
    interestRemainderCharge: {
        type: Number,
        label: function () {
            if (Meteor.isClient) {
                let labelType = 'Penalty remainder charge ($)';
                let calculateType = AutoForm.getFieldValue('calculateType');
                if (calculateType == 'P') {
                    labelType = 'Penalty remainder charge (%)';
                }
                return labelType;
            }
        },
        min: 0,
        max: function () {
            if (Meteor.isClient) {
                let calculateType = AutoForm.getFieldValue('calculateType');
                if (calculateType == 'P') {
                    return 100;
                }
            }
        }
    },
    penaltyRemainderTypeOf: {
        type: String,
        label: 'Penalty Remainder Type Of',
        optional: true,
        autoform: {
            type: "select2",
            defaultValue: 'Disbursement',
            options: function () {
                let interestRemainderTypeOf = [];
                interestRemainderTypeOf.push(
                    {label: "Disbursement", value: "Disbursement"},
                    {label: "Loan Outstanding", value: "Loan Outstanding"},
                    {label: "Amount Remainder", value: "Amount Remainder"},
                    {label: "Interest Remainder", value: "Interest Remainder"},
                    {label: "Principal Remainder", value: "Principal Remainder"}
                )
                return interestRemainderTypeOf;
            }
        }
    }
});

PenaltyClosing.attachSchema(PenaltyClosing.schema);
