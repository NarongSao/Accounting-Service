import {check} from 'meteor/check';
import math from 'mathjs';
import {ClearPrepay} from '../../common/collections/clearPrepay.js';
import {Repayment} from '../../common/collections/repayment.js';


Meteor.methods({
    microfis_removeClearPrepay: function (id) {
        return ClearPrepay.remove({_id: id});
    },
    microfis_getLastClearPrepay: function (branchId, loanAccId) {

        let selector = {};
        if (branchId) {
            selector.branchId = branchId;
        }

        if (loanAccId) {
            selector.loanAccId = loanAccId;
        }
        let repayment = undefined;
        if (loanAccId) {
            repayment = Repayment.findOne(selector, {sort: {repaidDate: -1}});
        }
        let clearPrepay = ClearPrepay.findOne({branchId: branchId}, {sort: {closeDate: -1}});
        if (repayment) {
            if (clearPrepay && moment(clearPrepay.closeDate).toDate().getTime() < moment(repayment.repaidDate).toDate().getTime()) {
                clearPrepay.closeDate = repayment.repaidDate;
            }
        }

        return clearPrepay;
    }

})