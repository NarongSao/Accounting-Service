import {check} from 'meteor/check';
import math from 'mathjs';
import {Repayment} from '../../../microfis/common/collections/repayment.js';


Meteor.methods({
    microfis_getLastVoucher: function (currencyId, startDate, branchId) {
        return Repayment.findOne({
            currencyId: currencyId,
            branchId: branchId,
            repaidDate: {$gte: startDate, $lte: moment(startDate).endOf("year").toDate()}
        }, {
            sort: {
                // repaidDate: -1,
                voucherId: -1
            }
        });
    }
})