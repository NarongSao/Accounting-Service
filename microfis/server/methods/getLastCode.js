import {check} from 'meteor/check';
import math from 'mathjs';
import {GroupLoan} from '../../../microfis/common/collections/groupLoan';


Meteor.methods({
    microfis_getCodeGroup: function (branchId) {
        return GroupLoan.findOne({
            branchId: branchId
        }, {
            sort: {
                // repaidDate: -1,
                code: -1
            }
        });
    }
})