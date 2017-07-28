import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {_} from 'meteor/erasaur:meteor-lodash';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../methods/select-opts.js';

export const SavingProduct = new Mongo.Collection("microfis_savingProduct");

// General
SavingProduct.generalSchema = new SimpleSchema({
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
SavingProduct.accountSchema = new SimpleSchema({
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
                    return [
                        {label: 'Single', value: 'S'},
                        {label: 'Join', value: 'J'}
                    ];
                }
            }
        }
    },
    // operationType: {
    //     type: [String],
    //     label: 'Operation type',
    //     autoform: {
    //         type: 'universe-select',
    //         afFieldInput: {
    //             multiple: true,
    //             uniPlaceholder: 'Please select',
    //             optionsPlaceholder: 'Unselect all',
    //             options: function () {
    //                 if (Meteor.isClient) {
    //                     let accountType = AutoForm.getFieldValue('accountType');
    //                     if (accountType == 'S') {
    //                         return [{label: 'None', value: 'None'}]
    //                     }
    //                     return [
    //                         {label: 'Any', value: 'Any'},
    //                         {label: 'Tow', value: 'Tow'},
    //                         {label: 'All', value: 'All'}
    //                     ];
    //                 }
    //             }
    //         }
    //     }
    // },
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
    minOpeningAmount: {
        type: Number,
        label: 'Minimum opening amount',
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
SavingProduct.termSchema = new SimpleSchema({
    accountClass: {
        type: String,
        label: 'Account class',
        defaultValue: 'E',
        autoform: {
            type: "select-radio-inline",
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
        label: 'Term in month',
        min: function () {
            if (Meteor.isClient) {
                let accountClass = AutoForm.getFieldValue('accountClass');
                if (accountClass == 'T') {
                    return 1;
                }

                return 0;
            }
        },
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    penaltyForTermClosing: {
        type: Number,
        label: 'Penalty for term closing',
        decimal: true,
        min: 0,
        max: 100,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.percentage()
            }
        }
    },
    interestTax: {
        type: Number,
        label: 'Interest tax (%)',
        decimal: true,
        min: 0,
        max: 100,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.percentage()
            }
        },
    },
    interestMethod: {
        type: String,
        label: 'Interest method',
        defaultValue: 'Y',
        autoform: {
            type: "select-radio-inline",
            afFieldInput: {
                options: function () {
                    return [
                        {label: 'Yearly', value: 'Y'},
                        {label: 'Monthly', value: 'M'}
                    ];
                }
            }
        }
    },
    daysInMethod: {
        type: Number,
        label: 'Days in method',
        autoform: {
            type: "select-radio-inline",
            options: function () {
                if (Meteor.isClient) {
                    let interestMethod = AutoForm.getFieldValue('interestMethod');

                    if (interestMethod == 'M') {
                        return [
                            {label: '30', value: 30},
                            {label: '31', value: 31}
                        ];
                    }

                    return [
                        {label: '365', value: 365},
                        {label: '360', value: 360}
                    ];
                }
            }
        }
    },
    interestRate: {
        type: Object,
        label: 'Interest rate (%)'
    },
    'interestRate.min': {
        type: Number,
        label: 'Min',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.currency({prefix: ''})
            }
        }
    },
    'interestRate.max': {
        type: Number,
        label: 'Max',
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.currency({prefix: ''})
            }
        },
        custom: function () {
            let min = this.field('interestRate.min').value;
            let max = this.value;

            if (min > max) {
                return 'cusMaxAmount';
            }
        }
    }
});

SavingProduct.attachSchema([
    SavingProduct.generalSchema,
    SavingProduct.accountSchema,
    SavingProduct.termSchema
]);

// Custom validate
SimpleSchema.messages({
    cusMaxDate: '[label] must be on or after Start Date',
    cusMaxAmount: '[label] must be equal or greater than Min Amount',
    cusOperationTypeIsRequired: '[label] is required'
});
