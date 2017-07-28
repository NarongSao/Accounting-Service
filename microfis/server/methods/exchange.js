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

            if(curTo=="KHR"){
                if(curFrom=="USD"){
                    return amount * ex.rates[curFrom];
                }else if(curFrom=="THB"){
                    return amount * ex.rates[curFrom];
                }
            }else if(curTo=="USD"){
                if(curFrom=="KHR"){
                    return amount / ex.rates[curFrom];
                }else if(curFrom=="THB"){
                    return amount / ex.rates[curFrom];
                }
            }else if(curTo=="THB"){
                if(curFrom=="KHR"){
                    return amount / ex.rates[curFrom];
                }else if(curFrom=="USD"){
                    return amount * ex.rates[curFrom];
                }
            }
        } else {
            return amount;
        }
    }
})