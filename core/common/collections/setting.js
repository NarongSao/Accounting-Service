import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {TAPi18n} from 'meteor/tap:i18n';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {__} from '../libs/tapi18n-callback-helper.js';

export const Setting = new Mongo.Collection("core_setting");

Setting.schema = new SimpleSchema({
    headOffice: {
        type: String,
        label: __('core.setting.headOfficeLbl'),
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.branch();
            },
            afFieldInput: {
                select2Options: {
                    placeholder: '(Select One)',
                    // allowClear: true
                }
            }
        }
    },
    baseCurrency: {
        type: String,
        label: __('core.setting.baseCurrencyLbl'),
        autoform: {
            type: "select-radio-inline",
            options: function () {
                return SelectOpts.currency(false);
            }
        }
    },
    roundNumber: {
        type: Object,
        label: 'Round number'
    },
    'roundNumber.type': {
        type: String,
        label: 'Type',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'general',
            options: function () {
                return [
                    {label: 'General', value: 'general'},
                    {label: 'Up', value: 'up'},
                    {label: 'Down', value: 'down'},
                ];
            }
        }
    },
    'roundNumber.khrPrecision': {
        type: Number,
        label: 'KHR precision',
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    'roundNumber.usdPrecision': {
        type: Number,
        label: 'USD precision',
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    'roundNumber.thbPrecision': {
        type: Number,
        label: 'THB precision',
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    language: {
        type: String,
        label: __('core.setting.languageLbl'),
        autoform: {
            type: "select-radio-inline",
            options: function () {
                return [
                    {label: 'En', value: 'en'},
                    {label: 'Km', value: 'km'}
                ];
            }
        }
    },
    integrate: {
        type: Boolean,
        label: __('core.setting.integrateLbl'),
        defaultValue: false
    },
    paymentMethod: {
        type: [String],
        label: "Payment Method",
        autoform: {
            type: "select-multiple",
            options: function () {

                let list = [];
                list.push({value: 'D', label: 'Daily'});
                list.push({value: 'W', label: 'Weekly'});
                // list.push({value: 'F', label: 'Two Weekly'}); // Fortnightly
                list.push({value: 'M', label: 'Monthly'});
                // list.push({value: 'Q', label: 'Quarterly'});
                // list.push({value: 'H', label: 'Half Yearly'});
                list.push({value: 'Y', label: 'Yearly'});
                return list;
            }
        }
    },

    isDisableJournalDate: {
        type: Boolean,
        label: __('core.setting.isDisableJournalDateLbl'),
        defaultValue: false
    },
    isDisableVoucher: {
        type: Boolean,
        label: __('core.setting.isDisableVoucherLbl'),
        defaultValue: false
    }
});

Setting.attachSchema(Setting.schema);
