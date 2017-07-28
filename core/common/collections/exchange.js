import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {moment} from 'meteor/momentjs:moment';
import {TAPi18n} from 'meteor/tap:i18n';
import {__} from '../libs/tapi18n-callback-helper.js';

export const Exchange = new Mongo.Collection("core_exchange");

let Rates = new SimpleSchema({
    KHR: {
        type: Number,
        label: function () {
            return TAPi18n.__('core.exchange.khrLbl') +" Ex : 1";
        },
        decimal: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency({prefix: '៛', digits: 9});
            }
        }
    },
    USD: {
        type: Number,
        label: function () {
            return TAPi18n.__('core.exchange.usdLbl')+ " Ex: 4070";
        },
        decimal: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency({digits: 9});
            }
        }
    },
    THB: {
        type: Number,
        label: function () {
            return TAPi18n.__('core.exchange.thbLbl')+ " Ex: 130";
        },
        decimal: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency({prefix: 'B', digits: 9});
            }
        }
    }
});

Exchange.schema = new SimpleSchema({
    exDate: {
        type: Date,
        label: function () {
            return TAPi18n.__('core.exchange.dateLbl');
        },
        unique: true,
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
    exDateText: {
        type: String,
        optional: true
    },
    base: {
        type: String,
        label: function () {
            return TAPi18n.__('core.exchange.baseCurrencyLbl');
        }
    },
    rates: {
        type: Rates,
        label: function () {
            return TAPi18n.__('core.exchange.ratesLbl');
        }
    }
});

Exchange.attachSchema(Exchange.schema);
