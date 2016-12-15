import {check} from 'meteor/check';
import math from 'mathjs';
import {EndOfProcess} from '../../common/collections/endOfProcess.js';


Meteor.methods({
    microfis_removeEndOfProcess: function (id) {
        return EndOfProcess.remove({_id: id});
    },
    microfis_getLastEndOfProcess: function (branchId) {
        return EndOfProcess.findOne({branchId: branchId}, {sort: {closeDate: -1}});
    }

})