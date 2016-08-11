import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../ui/libs/select-opts.js';
import {SelectOptMethods} from '../../../common/methods/select-opts.js';

export const Product = new Mongo.Collection("microfis_savingProduct");

// General
Product.generalSchema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        unique: true,
        max: 250
    },
    shortName: {
        type: String,
        label: 'Short name',
        unique: true,
        max: 150
    },
    des: {
        type: String,
        label: 'Description',
        max: 500,
        optional: true
    }
});

// Account
Product.accountSchema = new SimpleSchema({
    accountType: {
        type: [String],
        label: 'Account type',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                multiple: true,
                uniPlaceholder: 'Please select',
                optionsPlaceholder: 'Unselect all',
                options: function () {
                    var list = [];
                    list.push({label: "(Select One)", value: ""});
                    list.push({label: 'Single', value: 'S'});
                    list.push({label: 'Join', value: 'J'});

                    return list;
                }
            }
        }
    },
    operationType: {
        type: String,
        label: 'Operation type',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    var list = [];
                    list.push({label: "(Select One)", value: ""});
                    list.push({label: 'Any', value: 'Any'});
                    list.push({label: 'Tow', value: 'Tow'});
                    list.push({label: 'All', value: 'All'});

                    return list;
                }
            }
        }
    },
    currencyId: {
        type: [String],
        label: 'Currency',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                multiple: true,
                uniPlaceholder: 'Please select',
                optionsPlaceholder: 'Unselect all',
                options: function () {
                    return SelectOpts.currency(false);
                }
            }
        }
    },
    exchange: {
        type: Object
    },
    'exchange.USD': {
        type: Number,
        label: 'USD',
        decimal: true,
        min: 1,
        defaultValue: 1,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: 'USD',
                inputmaskOptions: inputmaskOptions.currency(),
                readonly: true
            },
            label: false
        }
    },
    'exchange.KHR': {
        type: Number,
        label: 'KHR',
        decimal: true,
        min: 100,
        defaultValue: 4000,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: 'KHR',
                inputmaskOptions: inputmaskOptions.currency({prefix: 'R '})
            },
            label: false
        }
    },
    'exchange.THB': {
        type: Number,
        label: 'THB',
        decimal: true,
        min: 1,
        defaultValue: 35,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: 'THB',
                inputmaskOptions: inputmaskOptions.currency({prefix: 'B '})
            },
            label: false
        }
    },
    miniOpeningAmount: {
        type: Number,
        label: 'Minimum opening amount (USD)',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.currency()
            }
        }
    },
    miniBalanceAmount: {
        type: Number,
        label: 'Minimum balance amount (USD)',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.currency()
            }
        }
    }
});

// Term
Product.termSchema = new SimpleSchema({
    accountClass: {
        type: String,
        label: 'Account class',
        autoform: {
            type: "select-radio-inline",
            defaultValue:,
            options: function () {
                return [
                    {label: 'Easy', value: 'E'},
                    {label: 'Term', value: 'T'}
                ];
            }
        },
    },
    term: {
        type: Number,
        label: 'Term',
        optional: true // if account class = Term
    },
    interestRate: {
        type: Object,
        label: 'Interest rate'
    },
    'interestRate.min': {
        type: Number,
        label: 'Min of interest rate (%)',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                // placeholder: 'Min',
                inputmaskOptions: inputmaskOptions.currency({prefix: ''})
            },
            label: false
        }
    },
    'interestRate.max': {
        type: Number,
        label: 'Max of interest rate (%)',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                // placeholder: 'Max',
                inputmaskOptions: inputmaskOptions.currency({prefix: ''})
            },
            label: false
        },
        custom: function () {
            let min = this.field('interestRate.min').value;
            let max = this.value;

            if (min > max) {
                return 'cusMaxAmount';
            }
        }
    },
    interestTax: {
        type: Number,
        label: 'Interest tax',
        decimal: true,
        min: 0,
        max: 100,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.percentage()
            },
            label: false
        },
    },
    daysInYear: {
        type: Number,
        label: 'Days in year',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 365,
            options: function () {
                return [
                    {label: '365', value: 365},
                    {label: '360', value: 360}
                ];
            }
        }
    },
    maturityDate: {
        type: Date,
        label: 'Maturity date',
        optional: true
    },
    tenor: { // Total of day number
        type: Number,
        label: 'Tenor',
        optional: true
    }
});

Product.attachSchema([
    Product.generalSchema,
    Product.accountSchema,
    Product.interestSchema
]);
