import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Penalty = new Mongo.Collection("microfis_penalty");

Penalty.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
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
    penaltyTypeOf: {
        type: String,
        label: 'Penalty Type Of',
        optional: true,
        autoform: {
            type: "select2",
            defaultValue: 'Disbursement',
            options: function () {
                let penaltyTypeOf = [];
                penaltyTypeOf.push(
                    {label: "Disbursement", value: "Disbursement"},
                    {label: "Amount Due", value: "Amount Due"},
                    {label: "Interest Due", value: "Interest Due"},
                    {label: "Principal Due", value: "Principal Due"}
                )
                return penaltyTypeOf;
            }
        }
    },
    amount: {
        type: Number,
        label: function () {
            if (Meteor.isClient) {
                let labelType = 'Amount per late ($)';
                let calculateType = AutoForm.getFieldValue('calculateType');
                if (calculateType == 'P') {
                    labelType = 'Amount per day (%)';
                }
                return labelType;
            }
        },
        decimal: true,
        min: 0,
        autoform: {
            type: "inputmask",
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
    },
    graceDay: {
        type: Number,
        label: 'Grace (days)',
        min: 0
    }
});

Penalty.attachSchema(Penalty.schema);
