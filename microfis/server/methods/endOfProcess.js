import {check} from 'meteor/check';
import math from 'mathjs';
import {EndOfProcess} from '../../common/collections/endOfProcess.js';
import {Repayment} from '../../common/collections/repayment.js';


Meteor.methods({
    microfis_removeEndOfProcess: function (id) {
        return EndOfProcess.remove({_id: id});
    },
    microfis_getLastEndOfProcess: function (branchId) {

        let repayment = Repayment.findOne({branchId: branchId}, {sort: {repaidDate: -1}});
        let endOfProcess = EndOfProcess.findOne({branchId: branchId}, {sort: {closeDate: -1}});
        if (repayment) {
            if (endOfProcess && moment(endOfProcess.closeDate).toDate().getTime() < moment(repayment.repaidDate).toDate().getTime()) {
                endOfProcess.closeDate = repayment.repaidDate;
            }
        }


        return endOfProcess;
    }

})