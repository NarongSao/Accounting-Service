import {check} from 'meteor/check';
import math from 'mathjs';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';


Meteor.methods({
    microfis_getLastSavingTransaction: function (savingAccId) {
        return SavingTransaction.findOne({savingAccId: savingAccId}, {
            sort: {
                _id: -1,
                transactionDate: -1
            }
        });
    }

})