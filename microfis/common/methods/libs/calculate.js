import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';

// Lib
import {roundCurrency} from '../../../imports/api/libs/round-currency.js';

// Collection
import {Setting} from '../../../imports/api/collections/setting.js';

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
        currencyId: {
            type: String,
            optional: true
        },
    }).validator(),
    run(opts) {
        let ratePerDay, dayOfRates = 1, interest;

        // Get setting
        let setting = Setting.findOne();

        // Rate per day
        switch (opts.method) {
            case 'W': // Weekly
                dayOfRates = setting.dayOfRates.weekly;
                break;
            case 'M': // Monthly
                dayOfRates = setting.dayOfRates.monthly;
                break;
            case 'Y': // Yearly
                dayOfRates = setting.dayOfRates.yearly;
                break;
        }
        ratePerDay = (opts.interestRate / 100) / dayOfRates;

        interest = opts.amount * opts.numOfDay * ratePerDay;

        // Check currency
        if (opts.currencyId) {
            interest = roundCurrency(interest, opts.currencyId);
        }

        return interest;
    }
});