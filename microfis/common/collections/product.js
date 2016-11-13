import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../methods/select-opts.js';

export const Product = new Mongo.Collection("microfis_product");

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
    startDate: {
        type: Date,
        label: 'Start date',
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
    endDate: {
        type: Date,
        label: 'End date',
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
            let fromDate = moment(this.field('startDate').value);
            let toDate = moment(this.value);

            if (fromDate.isAfter(toDate)) {
                return 'cusMaxDate';
            }
        }
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
                    return SelectOpts.accountType(false);
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
    loanAmount: {
        type: Object
    },
    'loanAmount.min': {
        type: Number,
        label: 'Min of loan amount (USD)',
        decimal: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: 'Min ($)',
                inputmaskOptions: inputmaskOptions.currency()
            },
            label: false
        }
    },
    'loanAmount.max': {
        type: Number,
        label: 'Max of loan amount (USD)',
        decimal: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                placeholder: 'Max ($)',
                inputmaskOptions: inputmaskOptions.currency()
            },
            label: false
        },
        custom: function () {
            let min = this.field('loanAmount.min').value;
            let max = this.value;

            if (min > max) {
                return 'cusMaxAmount';
            }
        }
    }
});

// Repayment
Product.repaymentSchema = new SimpleSchema({
    paymentMethod: {
        type: String,
        label: 'Payment method',
        autoform: {
            type: 'select',
            afFieldInput: {
                options: function () {
                    return SelectOpts.paymentMethod(false);
                }
            }
        }
    },
    term: {
        type: Object,
        label: 'Term'
    },
    'term.min': {
        type: Number,
        label: 'Min term',
        min: 1,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                // placeholder: 'Min',
                inputmaskOptions: inputmaskOptions.integer()
            },
            label: false
        }
    },
    'term.max': {
        type: Number,
        label: 'Max term',
        min: 1,
        autoform: {
            type: 'inputmask',
            afFieldInput: {
                // placeholder: 'Max',
                inputmaskOptions: inputmaskOptions.integer()
            },
            label: false
        },
        custom: function () {
            let min = this.field('term.min').value;
            let max = this.value;

            if (min > max) {
                return 'cusMaxAmount';
            }
        }
    }
});

// Interest
Product.interestSchema = new SimpleSchema({
    interestMethod: {
        type: [String],
        label: 'Interest method',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                multiple: true,
                uniPlaceholder: 'Please select',
                optionsPlaceholder: 'Unselect all',
                options: function () {
                    return SelectOpts.interestMethod(false);
                }
            }
        }
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
    }
});

// Charge
Product.chargeSchema = new SimpleSchema({
    feeId: {
        type: String,
        label: 'Fee',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.fee'
            }
        }
    },
    penaltyId: {
        type: String,
        label: 'Penalty',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.penalty'
            }
        }
    },
    penaltyClosingId: {
        type: String,
        label: 'Penalty Closing',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.penaltyClosing'
            }
        }
    }
});


Product.attachSchema([
    Product.generalSchema,
    Product.accountSchema,
    Product.repaymentSchema,
    Product.interestSchema,
    Product.chargeSchema
]);


// Custom validate
SimpleSchema.messages({
    cusMaxDate: '[label] must be on or after Start Date',
    cusMaxAmount: '[label] must be equal or greater than Min Amount'
});
