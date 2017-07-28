
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';


/**
 * Collection
 */
export const ExchangeNBC = new Mongo.Collection("acc_exchangeNBC");

/**
 * Schema
 */
var Rates = new SimpleSchema({
    KHR: {
        type: Number,
        decimal: true,
        min:1,
        label: "KHR Ex: 1"
    },
    USD: {
        type: Number,
        decimal: true,
        min: 1,
        label: "USD Ex: 4070"
    },
    THB: {
        type: Number,
        decimal: true,
        min:1,
        label: "THB Ex: 130"
    }
});

ExchangeNBC.schema = new SimpleSchema({
    dateTime: {
        unique: true,
        type: Date,
        label: "Exchange Date",
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
    base: {
        type: String,
        label: "Base currency"
    },
    rates: {
        type: Rates
    }
});

/**
 * Attach schema
 */

Meteor.startup(function () {
    ExchangeNBC.schema.i18n("acc.exchangeNBC.schema");
    ExchangeNBC.attachSchema(ExchangeNBC.schema);
});

