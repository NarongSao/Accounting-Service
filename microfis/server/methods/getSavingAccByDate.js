import {check} from 'meteor/check';
import math from 'mathjs';
import {SavingAcc} from '../../common/collections/saving-acc.js';


Meteor.methods({
    microfis_getSavingAccByDate: function (date, clientId) {
        return SavingAcc.find({accDate: {$lte: moment(date).endOf("day").toDate()}, clientId: clientId}, {
            sort: {
                _id: -1,
                transactionDate: -1
            }
        }).fetch();
    }

})