import {check} from 'meteor/check';
import math from 'mathjs';
import {Exchange} from '../../../core/common/collections/exchange.js';


Meteor.methods({
    microfis_exchange: function (curFrom, curTo, amount, id) {
        var ex = Exchange.findOne({
            base: curTo,
            _id: id
        }, {
            sort: {
                _id: -1
            }
        });
        if (curFrom != curTo) {
            return amount / ex.rates[curFrom];
        } else {
            return amount;
        }
    }
})