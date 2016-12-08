import {check} from 'meteor/check';
import math from 'mathjs';
import {Repayment} from '../../../microfis/common/collections/repayment.js';


Meteor.methods({
    microfis_getLastVoucher: function (currencyId, startDate) {
        return Repayment.findOne({currencyId: currencyId, repaidDate: {$gte: startDate}}, {
            sort: {
                // repaidDate: -1,
                voucherId: -1
            }
        });
    }
})