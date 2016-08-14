import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import moment from 'moment';

// Lib
import {SelectOpts} from '../../ui/libs/select-opts.js';
import {SavingSelectOptMethods} from '../../../common/methods/saving-select-opts.js';

let state = new ReactiveDict();

// Tracker
if (Meteor.isClient) {
    Tracker.autorun(function () {
        let productDoc = Session.get('savingProductDoc');

        if (productDoc) {
            // Product ID
            state.set('productId', productDoc._id);

            // Account type
            let accountType = productDoc.accountType.map(function (value) {
                return {label: `${value}`, value: value};
            });
            state.set('accountType', accountType);

            // // Operation type
            // let operationType = productDoc.operationType.map(function (value) {
            //     return {label: `${value}`, value: value};
            // });
            // state.set('operationType', operationType);

            // Currency
            let currencyId = productDoc.currencyId.map(function (value) {
                return {label: `${value}`, value: value};
            });
            state.set('currencyId', currencyId);

            // Mini opening amount
            state.set('minOpeningAmount', productDoc.minOpeningAmount);
            state.set('exchange', productDoc.exchange);

            // Interest method
            state.set('interestMethod', productDoc.interestMethod);

            // Interest rate
            state.set('interestRate', productDoc.interestRate);
        }
    });
}

export const SavingAcc = new Mongo.Collection("microfis_savingAcc");

// Product
SavingAcc.productSchema = new SimpleSchema({
    productId: {
        type: String,
        label: 'Product',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.savingSelectOpts.product'
            }
        }
    },
});


// General
SavingAcc.generalSchema = new SimpleSchema({
    clientId: {
        type: String,
        label: 'Client'
    },
    productId: {
        type: String,
        label: 'Product',
        defaultValue: function () {
            if (Meteor.isClient) {
                return state.get('productId');
            }
        }
    },
    accDate: {
        type: Date,
        label: "Acc Date",
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        },
    },
    accountType: {
        type: String,
        label: 'Account type',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return state.get('accountType');
                }
            }
        }
    },
    operationType: {
        type: String,
        label: 'Operation type',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    if (Meteor.isClient) {
                        let accountType = AutoForm.getFieldValue('accountType');
                        if (accountType == 'J') {
                            return [
                                {label: 'Any', value: 'Any'},
                                {label: 'Tow', value: 'Tow'},
                                {label: 'All', value: 'All'}
                            ];
                        }

                        return [{label: 'None', value: 'None'}]
                    }
                }
            }
        }
    },
    currencyId: {
        type: String,
        label: 'Currency',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return state.get('currencyId');
                }
            }
        }
    },
    openingAmount: {
        type: Number,
        label: 'Opening amount',
        decimal: true,
        min: function () {
            if (Meteor.isClient) {
                let min = 0,
                    currencyId = AutoForm.getFieldValue('currencyId'),
                    minOpeningAmount = state.get('minOpeningAmount'),
                    exchange = state.get('exchange');

                if (minOpeningAmount && currencyId) {
                    min = minOpeningAmount;
                    if (currencyId == 'KHR') {
                        min = roundKhr(min * exchange.KHR);
                    } else if (currencyId == 'THB') {
                        min = math.round(min * exchange.THB);
                    }
                }

                state.set('minLoanAmountByCurrency', min);

                return min;
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                placeholder: function () {
                    if (Meteor.isClient) {
                        let prefix = '';
                        let currencyId = AutoForm.getFieldValue('currencyId');
                        if (currencyId == 'KHR') {
                            prefix = '៛ ';
                        } else if (currencyId == 'USD') {
                            prefix = '$ ';
                        } else if (currencyId == 'THB') {
                            prefix = 'B ';
                        }
                        state.set('currencySymbol', prefix);

                        let min = state.get('minLoanAmountByCurrency');

                        return numeral(min).format('0,0.00') + ` ${prefix}`;
                    }
                },
                inputmaskOptions: function () {
                    if (Meteor.isClient) {
                        let prefix = state.get('currencySymbol');
                        return inputmaskOptions.currency({prefix: prefix})
                    }
                }
            }
        }
    },
    interestRate: {
        type: Number,
        label: function () {
            return 'Interest rate per ' + state.get('interestMethod');
        },
        decimal: true,
        min: function () {
            let interestRate = state.get('interestRate');
            if (interestRate) {
                return interestRate.min;
            }
        },
        max: function () {
            let interestRate = state.get('interestRate');
            if (interestRate) {
                return interestRate.max;
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                placeholder: function () {
                    let interestRate = state.get('interestRate');
                    if (interestRate) {
                        return numeral(interestRate.min).format('0.00') + ' - ' + numeral(interestRate.max).format('0.00');
                    }
                },
                inputmaskOptions: inputmaskOptions.percentage()
            }
        }
    },
    memo: {
        type: String,
        label: "Memo",
        max: 500,
        optional: true,
        autoform: {
            afFieldInput: {
                rows: 4
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
    },
    attachFile: {
        type: String,
        label: 'Attach file',
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'fileUpload',
                collection: 'Files'
                //accept: 'image/*'
            }
        }
    },
    branchId: {
        type: String
    }
});

// Inheritor
SavingAcc.inheritorSchema = new SimpleSchema({
    inheritor: {
        type: Array,
        minCount: 0,
        maxCount: 5
    },
    'inheritor.$': {
        type: Object
    },
    'inheritor.$.name': {
        type: String,
        max: 250
    },
    'inheritor.$.gender': {
        type: String,
        autoform: {
            type: "select",
            options: function () {
                return SelectOpts.gender(false);
            }
        }
    },
    'inheritor.$.des': {
        type: String,
        max: 500,
        optional: true
    },
});

SavingAcc.attachSchema([
    SavingAcc.generalSchema,
    SavingAcc.inheritorSchema
]);

// Custom validate
SimpleSchema.messages({
    cusOperationTypeIsRequired: '[label] is required'
});
