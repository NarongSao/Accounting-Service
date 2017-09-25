import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';
import BigNumber from 'bignumber.js';
// Lib
import {roundCurrency} from './round-currency.js';

// Collection
import {Setting} from '../collections/setting.js';

export let Calculate = {};

Calculate.interest = new ValidatedMethod({
    name: 'microfis.Calculate.interest',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        amount: {
            type: Number,
            decimal: true
        },
        numOfDay: {
            type: Number
        },
        interestRate: {
            type: Number,
            decimal: true
        },
        method: {
            type: String
        },
        dayInMethod: {
            type: Number,
            optional: true
        },
        currencyId: {
            type: String,
            optional: true
        },
        interestType: {
            type: String,
            optional: true
        }
    }).validator(),
    run(opts) {
        let ratePerDay, dayInMethod, interest;

        // Get setting
        let setting = Setting.findOne();

        // Rate per day
        if (opts.dayInMethod) {
            dayInMethod = opts.dayInMethod;
        } else {
            switch (opts.method) {
                case 'D': // Daily
                    dayInMethod = 1;
                    break;
                case 'W': // Weekly
                    dayInMethod = setting.dayOfRates.weekly;
                    break;
                case 'M': // Monthly
                    dayInMethod = setting.dayOfRates.monthly;
                    break;
                case 'Y': // Yearly
                    dayInMethod = setting.dayOfRates.yearly;
                    break;
            }
        }

        if (opts.interestType == "A") {
            ratePerDay = opts.interestRate / dayInMethod;
            interest = opts.numOfDay * ratePerDay;

        } else {
            ratePerDay = (opts.interestRate / 100) / dayInMethod;
            interest = opts.amount * opts.numOfDay * ratePerDay;
        }

        // Check currency
        if (opts.currencyId) {
            interest = roundCurrency(interest, opts.currencyId);
        }

        return interest;
    }
});

Calculate.feeOnPayment = new ValidatedMethod({
    name: 'microfis.Calculate.feeOnPayment',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        disbursementAmount: {
            type: Number,
            decimal: true
        },
        amount: {
            type: Number,
            decimal: true
        },
        principal: {
            type: Number,
            decimal: true
        },
        interest: {
            type: Number,
            decimal: true
        },

        currencyId: {
            type: String,
            optional: true
        },
        productDoc: {
            type: Object,
            optional: true,
            blackbox: true
        },
        loanOutstanding: {
            type: Number,
            decimal: true
        }
    }).validator(),
    run(opts) {
        let feeOnPayment = 0;

        Meteor.call("microfis_feeOnPaymentCalculate", opts.disbursementAmount, opts.amount, opts.principal, opts.interest, opts.currencyId, opts.productDoc, opts.loanOutstanding, function (err, result) {
            if (result) {
                feeOnPayment = result;
            }
        })

        // Check currency
        if (opts.currencyId) {
            feeOnPayment = roundCurrency(feeOnPayment, opts.currencyId);
        }

        return feeOnPayment;
    }
});


BigNumber.config({ERRORS: false});