import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Mongo} from 'meteor/mongo';
import {ReactiveDict} from 'meteor/reactive-dict';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import math from 'mathjs';
import {_} from 'meteor/erasaur:meteor-lodash';

// Lib
import {roundCurrency} from '../libs/round-currency.js';

import {SelectOpts} from '../../imports/libs/select-opts.js';
import {lookupValue} from '../../imports/libs/lookup-value.js';
import {SelectOptMethods} from '../methods/select-opts.js';

// Method
import {lookupProduct} from '../methods/lookup-product.js';

let state = new ReactiveDict();

// Tracker
if (Meteor.isClient) {
    Tracker.autorun(function () {
        let productDoc = Session.get('productDoc');

        if (productDoc) {
            // Product ID
            state.set('productId', productDoc._id);

            // Date
            state.set('startDate', moment(productDoc.startDate).format('DD/MM/YYYY'));
            state.set('endDate', moment(productDoc.endDate).format('DD/MM/YYYY'));

            // Account type
            let accountType = productDoc.accountType.map(function (value) {
                return {label: `${value}`, value: value};
            });
            state.set('accountType', accountType);

            // Currency
            let currencyId = productDoc.currencyId.map(function (value) {
                return {label: `${value}`, value: value};
            });
            state.set('currencyId', currencyId);

            // Loan amount
            state.set('exchange', productDoc.exchange);
            state.set('loanAmount', productDoc.loanAmount);

            // Payment Method
            state.set('paymentMethod', productDoc.paymentMethod);

            // Term
            state.set('term', productDoc.term);

            // Interest Method
            /*let interestMethod = productDoc.interestMethod.map(function (value) {
             return {label: `${value}`, value: value};
             });*/
            let interestMethod = productDoc.interestMethod;

            state.set('interestMethod', interestMethod);

            // Interest Method
            state.set('interestRate', productDoc.interestRate);
        }
    });
}

export const LoanAcc = new Mongo.Collection("microfis_loanAcc");

// Product
LoanAcc.productSchema = new SimpleSchema({
    productId: {
        type: String,
        label: 'Product',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.product'
            }
        }
    },
});

// General
LoanAcc.generalSchema = new SimpleSchema({
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
    submitDate: {
        type: Date,
        label: 'Submit date',
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
        custom: function () {
            let disbursementDate = moment(this.field('disbursementDate').value);
            let submitDate = moment(this.value);

            if (submitDate.isAfter(disbursementDate, 'day')) {
                return 'cusMaxDateForSubmitDate';
            }
        }
    },
    disbursementDate: {
        type: Date,
        label: function () {
            return Spacebars.SafeString(`Disbursement date <span class="text-red">(${state.get('startDate')} - ${state.get('endDate')})</span>`);
        },
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        },
        custom: function () {
            if (Meteor.isClient) {

                let startDate = moment(state.get('startDate'), 'DD/MM/YYYY');
                let endDate = moment(state.get('endDate'), 'DD/MM/YYYY');
                let disbursementDate = moment(this.value);

                if (!disbursementDate.isBetween(startDate, endDate, 'day', '[]')) {
                    return 'cusBetweenDateForLoanAccDate';
                }
            }
        }
    },
    approveDate: {
        type: Date,
        optional: true
    },
    writeOffDate: {
        type: Date,
        optional: true
    },
    closeDate: {
        type: Date,
        optional: true
    },
    cancelDate: {
        type: Date,
        optional: true
    },
    restructureDate: {
        type: Date,
        optional: true
    },
    fundId: {
        type: String,
        label: 'Fund',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: 'Unselect all',
                optionsMethod: 'microfis.selectOpts.fund'
            }
        }
    },
    creditOfficerId: {
        type: String,
        label: 'Credit officer',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.creditOfficer'
            }
        }
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
    },
    parentId: {
        type: String,
        defaultValue: "0"
    },
    status: {
        type: String,
        defaultValue: "Active"
        //  Check
        //  Active
        //  Write Off
        //  Restructure
        //  Cancel
        //  Close
    },
    paymentNumber: {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    savingAccId: {
        type: String,
        label: "Saving Account",
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                    let clientId = FlowRouter.getParam('clientId');
                    let sub = Meteor.subscribe("microfis.savingAccByClientId", FlowRouter.getParam("clientId"));
                    return SelectOpts.savingAcc(clientId);
                }
            }
        }

    },
    feeAmount: {
        type: Number,
        decimal: true,
        defaultValue: 0,
        optional: true
    },
    voucherCode: {
        type: String,
        optional: true,
        defaultValue: ""
    },
    isAddToGroup: {
        type: Boolean,
        optional: true,
        defaultValue: false
    }
});

// Account
LoanAcc.accountSchema = new SimpleSchema({
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
    currencyId: {
        type: String,
        label: 'Currency',
        /*autoform: {
         type: 'select',
         afFieldInput: {
         options: function () {
         return state.get('currencyId');
         }
         }
         }*/
    },
    projectInterest: {
        type: Number,
        label: 'Project Interest',
        decimal: true,
        optional: true
    },
    loanAmount: {
        type: Number,
        label: 'Loan amount',
        decimal: true,
        min: function () {
            if (Meteor.isClient) {
                let min = 0.01,
                    currencyId = AutoForm.getFieldValue('currencyId'),
                    loanAmount = state.get('loanAmount'),
                    exchange = state.get('exchange');

                if (loanAmount && currencyId) {
                    min = loanAmount.min;
                    if (currencyId == 'KHR') {
                        min = roundKhr(min * exchange.KHR);
                    } else if (currencyId == 'THB') {
                        min = math.round(min * exchange.THB);
                    }
                }

                state.set('minLoanAmount', min);

                return min;
            }
        },
        max: function () {
            if (Meteor.isClient) {
                let max = 0.01,
                    currencyId = AutoForm.getFieldValue('currencyId'),
                    loanAmount = state.get('loanAmount'),
                    exchange = state.get('exchange');

                if (loanAmount && currencyId) {
                    max = loanAmount.max;
                    if (currencyId == 'KHR') {
                        max = roundKhr(max * exchange.KHR);
                    } else if (currencyId == 'THB') {
                        max = math.round(max * exchange.THB);
                    }
                }

                state.set('maxLoanAmount', max);

                return max;
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

                        let min = state.get('minLoanAmount');
                        let max = state.get('maxLoanAmount');

                        return numeral(min).format('0,0.00') + ' - ' + numeral(max).format('0,0.00') + ` ${prefix}`;
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
    }
});

// Repayment
LoanAcc.repaymentSchema = new SimpleSchema({
    paymentMethod: {
        type: String,
        label: 'Payment method',
        defaultValue: function () {
            if (Meteor.isClient) {
                return state.get('paymentMethod');
            }
        }
    },

    term: {
        type: Number,
        label: 'Term',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    let term = state.get('term');
                    if (term) {
                        let list = [];
                        for (let i = term.min; i <= term.max; i++) {
                            list.push({value: i, label: `${i}`});
                        }

                        return list;
                    }
                }
            }
        }
    },
    repaidFrequency: {
        type: Number,
        label: 'Interest Repayment Frequency',
        defaultValue: 1,
        min: 1,
        max: function () {
            if (Meteor.isClient) {
                return AutoForm.getFieldValue('term');
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    firstRepaymentDate: {
        type: Date,
        label: 'First Payment Date',
        optional: true,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true,
                    showClear: true
                }
            }
        },
        custom: function () {
            let disbursementDate = moment(this.field('disbursementDate').value, 'DD/MM/YYYY');
            let firstRepaymentDate = moment(this.value, 'DD/MM/YYYY');

            if (disbursementDate.isSameOrAfter(firstRepaymentDate, 'day')) {
                return 'cusMinDateForFirstRepaymentDate';
            }
        }
    },
    dueDateOn: {
        type: Number,
        label: 'Due date on',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    if (Meteor.isClient) {
                        let list = [];
                        let paymentMethod = state.get('paymentMethod');

                        if (paymentMethod) {
                            if (paymentMethod == 'D') {
                                list.push({label: 'Null', value: 0});
                            } else if (paymentMethod == 'W') {
                                list.push({label: 'Mon', value: 1});
                                list.push({label: 'Tue', value: 2});
                                list.push({label: 'Wed', value: 3});
                                list.push({label: 'Thu', value: 4});
                                list.push({label: 'Fri', value: 5});
                                list.push({label: 'Sat', value: 6});
                                list.push({label: 'Sun', value: 7});
                            } else if (paymentMethod == 'M' || paymentMethod == 'Y') {
                                for (let i = 1; i <= 25; i++) {
                                    list.push({label: `${i}`, value: i});
                                }
                            }

                            return list;
                        }
                    }
                }
            }
        }
    },
    feeDate: {
        type: Date,
        optional: true
    },

    principalInstallment: {
        type: Object,
        label: 'Principal installment'
    },
    'principalInstallment.frequency': {
        type: Number,
        label: 'Frequency',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    if (Meteor.isClient) {
                        let term = AutoForm.getFieldValue('term');
                        if (term) {
                            let list = [];
                            for (let i = 1; i <= term; i++) {
                                list.push({label: `${i}`, value: i});
                            }

                            return list;
                        }
                    }
                }
            }
        }
    },
    'principalInstallment.calculateType': {
        type: String,
        label: 'Calculate type',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'P',
            options: function () {
                return SelectOpts.calculateType(false);
            }
        }
    },
    'principalInstallment.amount': {
        type: Number,
        label: 'Amount',
        min: function () {
            if (Meteor.isClient) {
                let min = 1;
                let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType'),
                    currencyId = AutoForm.getFieldValue('currencyId');

                if (calculateType == 'A' && currencyId) {
                    switch (currencyId) {
                        case 'KHR':
                            min = 5000;
                            break;
                        case 'USD':
                            min = 1;
                            break;
                        case 'THB':
                            min = 50;
                            break;
                    }
                }

                state.set('minPrincipalInstallmentAmount', min);

                return min;
            }
        },

        max: function () {
            if (Meteor.isClient) {
                let max = 100;
                let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType'),
                    currencyId = AutoForm.getFieldValue('currencyId'),
                    loanAmount = AutoForm.getFieldValue('loanAmount'),
                    term = AutoForm.getFieldValue('term'),
                    frequency = AutoForm.getFieldValue('principalInstallment.frequency');

                let checker = calculateType == 'A' && currencyId && loanAmount > 0 && term && frequency > 0;
                if (checker) {
                    let numOfFrequency = _.ceil(term / frequency);
                    max = roundCurrency(loanAmount / numOfFrequency, currencyId);
                }

                state.set('maxPrincipalInstallmentAmount', max);

                return max;
            }
        },
        autoform: {
            type: "inputmask",
            defaultValue: 'A',
            afFieldInput: {
                placeholder: function () {
                    if (Meteor.isClient) {
                        let prefix = state.get('currencySymbol');
                        let min = state.get('minPrincipalInstallmentAmount');
                        let max = state.get('maxPrincipalInstallmentAmount');
                        let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType');

                        if (calculateType == "P") {
                            return '1 - 100 %';
                        } else {
                            return numeral(min).format('0,0.00') + ' - ' + numeral(max).format('0,0.00') + ` ${prefix}`;
                        }
                    }
                },
                inputmaskOptions: function () {
                    if (Meteor.isClient) {
                        let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType');
                        if (calculateType == 'P') {
                            return inputmaskOptions.integer();
                        }

                        let prefix = state.get('currencySymbol');
                        return inputmaskOptions.currency({prefix: prefix})
                    }
                }
            }
        }
        // autoform: {
        //     type: 'select',
        //     afFieldInput: {
        //         options: function () {
        //             let list = [];
        //             let term = AutoForm.getFieldValue('term');
        //             let principalInstallmentFrequency = AutoForm.getFieldValue('principalInstallmentFrequency');
        //
        //             if (term == principalInstallmentFrequency) {
        //                 list.push({label: '100', value: 100});
        //             } else {
        //                 let installment = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        //                 _.forEach(installment, (value)=> {
        //                     list.push({label: `${value}`, value: value});
        //                 })
        //             }
        //
        //             return list;
        //         }
        //     }
        // }
    },
    paymentLocation: {
        type: String,
        label: 'Payment location',
        autoform: {
            type: "select",
            options: function () {
                return SelectOpts.paymentLocation(false);
            }
        }
    },
    escapeDayMethod: {
        type: String,
        label: 'Escape day method',
        autoform: {
            type: "select-radio-inline",
            defaultValue: 'GR',
            options: function () {
                return SelectOpts.escapeDayMethod(false);
            }
        }
    },
    escapeDayFrequency: {
        type: Number,
        label: 'Escape day frequency',
        defaultValue: 1,
        min: 1,
        optional: true,
        autoform: {
            type: "inputmask",
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    installmentAllowClosing: {
        type: Number,
        label: 'Installment allow closing',
        optional: true
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


// Interest
LoanAcc.interestSchema = new SimpleSchema({
    interestMethod: {
        type: String,
        label: 'Interest method',
        defaultValue: function () {
            return state.get('interestMethod');
        }
        /*autoform: {
         type: 'select',
         afFieldInput: {
         options: function () {
         return state.get('interestMethod');
         }
         }
         }*/
    },
    interestRate: {
        type: Number,
        label: 'Interest rate (%)',
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
    }
});

// Location
LoanAcc.locationSchema = new SimpleSchema({
    locationId: {
        type: String,
        label: 'Location',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'microfis.selectOpts.location',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        return {type: 'V'};
                    }
                }
            }
        },
    },
    geography: {
        type: String,
        label: 'Geography',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: '(Select One)',
                optionsPlaceholder: true,
                options: function () {
                    return SelectOpts.geography(false);
                }
            }
        }
    }
});

// Financial
// LoanAcc.financialSchema = new SimpleSchema({
//     totalIncome: {
//         type: Number,
//         label: 'Total income',
//         decimal: true,
//         autoform: {
//             type: "inputmask",
//             afFieldInput: {
//                 inputmaskOptions: inputmaskOptions.currency()
//             }
//         }
//     },
//     totalExpense: {
//         type: String,
//         label: 'Total expense',
//         decimal: true,
//         autoform: {
//             type: "inputmask",
//             afFieldInput: {
//                 inputmaskOptions: inputmaskOptions.currency()
//             }
//         }
//     },
//     totalProfit: {
//         type: String,
//         label: 'Total profit',
//         decimal: true,
//         autoform: {
//             type: "inputmask",
//             afFieldInput: {
//                 inputmaskOptions: inputmaskOptions.currency()
//             }
//         }
//     },
//     totalAsset: {
//         type: String,
//         label: 'Total asset',
//         decimal: true,
//         autoform: {
//             type: "inputmask",
//             afFieldInput: {
//                 inputmaskOptions: inputmaskOptions.currency()
//             }
//         }
//     },
//     totalCollateral: {
//         type: String,
//         label: 'Total collateral',
//         decimal: true,
//         autoform: {
//             type: "inputmask",
//             afFieldInput: {
//                 inputmaskOptions: inputmaskOptions.currency()
//             }
//         }
//     },
// });

// Other
LoanAcc.otherSchema = new SimpleSchema({
    cycle: {
        type: Number,
        label: 'Cycle',
        defaultValue: 1,
        min: 1,
        autoform: {
            type: "inputmask",
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    history: {
        type: String,
        label: 'History',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('History', {selectOne: false});
                }
            }
        }
    },
    purpose: {
        type: String,
        label: 'Purpose',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('Purpose', {selectOne: false});
                }
            }
        }
    },
    purposeActivity: {
        type: String,
        label: 'Purpose activity',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('Purpose Activity', {selectOne: false});
                }
            }
        }
    },
    collateralType: {
        type: String,
        label: 'Collateral type',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('Collateral Type', {selectOne: false});
                }
            }
        }
    },
    collateralNote: {
        type: String,
        optional: true,
        label: 'Collateral note',
        max: 500
    },
    collateralSecurity: {
        type: String,
        optional: true,
        label: 'Collateral security',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('Collateral Security', {selectOne: false});
                }
            }
        }
    },
    povertyLevel: {
        type: String,
        label: 'Poverty level',
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return lookupValue('Poverty Level', {selectOne: false});
                }
            }
        }
    },
});

LoanAcc.attachSchema([
    LoanAcc.generalSchema,
    LoanAcc.accountSchema,
    LoanAcc.repaymentSchema,
    LoanAcc.interestSchema,
    LoanAcc.locationSchema,
    LoanAcc.writeOff,
    LoanAcc.otherSchema
]);

// Custom validate
SimpleSchema.messages({
    cusMaxDateForSubmitDate: '[label] cannot be after [LoanAcc Date]',
    cusMinDateForFirstRepaymentDate: '[label] must be on or after [LoanAcc Date]',
    cusBetweenDateForLoanAccDate: `LoanAcc date must be between [Start - End Date]`
});


LoanAcc.reStructure = new SimpleSchema({
    disbursementDate: {
        type: Date,
        label: function () {
            return Spacebars.SafeString(`Disbursement Date <span class="text-red">(${state.get('startDate')} - ${state.get('endDate')})</span>`);
        },
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }
    },
    loanAmount: {
        type: Number,
        label: 'Loan amount',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    interestRate: {
        type: Number,
        label: 'Interest rate (%)',
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
    currencyId: {
        type: String,
        label: 'Currency',
        optional: true
    },
    term: {
        type: Number,
        label: 'Term',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    let term = state.get('term');
                    if (term) {
                        let list = [];
                        for (let i = term.min; i <= term.max; i++) {
                            list.push({value: i, label: `${i}`});
                        }

                        return list;
                    }
                }
            }
        }
    },

    repaidFrequency: {
        type: Number,
        label: 'Repaid Frequency',
        defaultValue: 1,
        min: 1,
        max: function () {
            if (Meteor.isClient) {
                return AutoForm.getFieldValue('term');
            }
        },
        autoform: {
            type: "inputmask",
            afFieldInput: {
                inputmaskOptions: inputmaskOptions.integer()
            }
        }
    },
    principalInstallment: {
        type: Object,
        label: 'Principal installment'
    },
    'principalInstallment.frequency': {
        type: Number,
        label: 'Frequency',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    if (Meteor.isClient) {
                        let term = AutoForm.getFieldValue('term');

                        if (term) {
                            let list = [];
                            for (let i = 1; i <= term; i++) {
                                list.push({label: `${i}`, value: i});
                            }

                            return list;
                        }
                    }
                }
            }
        }
    },
    'principalInstallment.calculateType': {
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
    'principalInstallment.amount': {
        type: Number,
        label: 'Amount',
        min: function () {
            if (Meteor.isClient) {
                let min = 1;
                let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType'),
                    currencyId = AutoForm.getFieldValue('currencyId');

                if (calculateType == 'A' && currencyId) {
                    switch (currencyId) {
                        case 'KHR':
                            min = 5000;
                            break;
                        case 'USD':
                            min = 1;
                            break;
                        case 'THB':
                            min = 50;
                            break;
                    }
                }

                state.set('minPrincipalInstallmentAmount', min);

                return min;
            }
        },
        max: function () {
            if (Meteor.isClient) {
                let max = 100;
                let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType'),
                    currencyId = AutoForm.getFieldValue('currencyId'),
                    loanAmount = AutoForm.getFieldValue('loanAmount'),
                    term = AutoForm.getFieldValue('term'),
                    frequency = AutoForm.getFieldValue('principalInstallment.frequency');

                let checker = calculateType == 'A' && currencyId && loanAmount > 0 && term && frequency > 0;
                if (checker) {
                    let numOfFrequency = _.ceil(term / frequency);
                    max = roundCurrency(loanAmount / numOfFrequency, currencyId);
                }

                state.set('maxPrincipalInstallmentAmount', max);

                return max;
            }
        },
        autoform: {
            type: "inputmask",
            defaultValue: 'A',
            afFieldInput: {
                placeholder: function () {
                    if (Meteor.isClient) {
                        let currencyId = AutoForm.getFieldValue('currencyId');
                        let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType');

                        let prefix = "";
                        if (currencyId == 'KHR') {
                            prefix = '៛ ';
                        } else if (currencyId == 'USD') {
                            prefix = '$ ';
                        } else if (currencyId == 'THB') {
                            prefix = 'B ';
                        }

                        state.set('currencySymbol', prefix);

                        let min = state.get('minPrincipalInstallmentAmount');
                        let max = state.get('maxPrincipalInstallmentAmount');
                        if (calculateType == "P") {
                            return '1 - 100 %';
                        } else {
                            return numeral(min).format('0,0.00') + ' - ' + numeral(max).format('0,0.00') + ` ${prefix}`;
                        }

                    }
                },
                inputmaskOptions: function () {
                    if (Meteor.isClient) {
                        let calculateType = AutoForm.getFieldValue('principalInstallment.calculateType');
                        if (calculateType == 'P') {
                            return inputmaskOptions.integer();
                        }

                        let prefix = state.get('currencySymbol');
                        return inputmaskOptions.currency({prefix: prefix})
                    }
                }
            }
        }

    },
    firstRepaymentDate: {
        type: Date,
        label: 'First repayment date',
        // defaultValue: moment().toDate(),
        optional: true,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true,
                    showClear: true
                }
            }
        },
        custom: function () {
            let disbursementDate = moment(this.field('disbursementDate').value, 'DD/MM/YYYY');
            let firstRepaymentDate = moment(this.value, 'DD/MM/YYYY');

            if (disbursementDate.isSameOrAfter(firstRepaymentDate, 'day')) {
                return 'cusMinDateForFirstRepaymentDate';
            }
        }
    },


    dueDateOn: {
        type: Number,
        label: 'Due date on',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    if (Meteor.isClient) {
                        let list = [];
                        let paymentMethod = state.get('paymentMethod');

                        if (paymentMethod) {
                            if (paymentMethod == 'D') {
                                list.push({label: 'Null', value: 0});
                            } else if (paymentMethod == 'W') {
                                list.push({label: 'Mon', value: 1});
                                list.push({label: 'Tue', value: 2});
                                list.push({label: 'Wed', value: 3});
                                list.push({label: 'Thu', value: 4});
                                list.push({label: 'Fri', value: 5});
                                list.push({label: 'Sat', value: 6});
                                list.push({label: 'Sun', value: 7});
                            } else if (paymentMethod == 'M' || paymentMethod == 'Y') {
                                for (let i = 1; i <= 25; i++) {
                                    list.push({label: `${i}`, value: i});
                                }
                            }

                            return list;
                        }
                    }
                }
            }
        }
    }
});

LoanAcc.writeOff = new SimpleSchema({
    writeOff: {
        type: Object,
        optional: true
    },
    'writeOff.writeOffDate': {
        type: Date,
        defaultValue: moment().toDate(),
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }
    },
    'writeOff.amount': {
        type: Number,
        label: 'Amount',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    'writeOff.interest': {
        type: Number,
        label: 'Interest',
        decimal: true,

        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal({digits: 2});
            }
        }
    },
    'writeOff.description': {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'summernote',
                class: 'editor',
                settings: {
                    height: 80,
                    minHeight: null,
                    maxHeight: null,
                    toolbar: [
                        ['font', ['bold', 'italic', 'underline', 'clear']],
                        ['para', ['ul', 'ol']]

                    ]
                }
            }
        }

    },
    paymentWriteOff: {
        type: [Object],
        optional: true
    },
    'paymentWriteOff.$.rePaidDate': {
        type: Date,
        defaultValue: moment().toDate(),
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }
    },
    'paymentWriteOff.$.amount': {
        type: Number,
        label: 'Amount',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal({digits: 2});
            }
        }
    },
    'paymentWriteOff.$.interest': {
        type: Number,
        label: 'Interest',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal({digits: 2});
            }
        }
    },
    'paymentWriteOff.$.unPaidPrincipal': {
        type: Number,
        label: 'UnPaid Principal',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal({digits: 2});
            }
        }
    },
    'paymentWriteOff.$.unPaidInterest': {
        type: Number,
        label: 'UnPaid Interest',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Credit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal({digits: 2});
            }
        }
    }
});