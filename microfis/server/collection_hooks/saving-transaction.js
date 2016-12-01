import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import math from 'mathjs';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction';
import {SavingAcc} from '../../common/collections/saving-acc';

// Before insert
SavingTransaction.before.insert(function (userId, doc) {
    let prefix = doc.savingAccId + '-';
    doc._id = idGenerator2.genWithPrefix(SavingTransaction, {
        prefix: prefix,
        length: 6
    });
});

// After insert
SavingTransaction.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        let transactionCount = SavingTransaction.find().count();
        if (transactionCount == 1) {
            SavingAcc.update({_id: doc.savingAccId}, {
                $set: {
                    'status.value': 'Active',
                    'status.activeDate': doc.transactionDate
                }
            });
        }

        SavingAcc.update({_id: doc.savingAccId}, {$set: {savingNumber: transactionCount}});

    });
});

// After remove
SavingTransaction.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        let transactionCount = SavingTransaction.find().count();
        if (transactionCount == 0) {
            SavingAcc.update({_id: doc.savingAccId}, {
                $set: {
                    'status.value': 'Inactive'
                },
                $unset: {
                    'status.activeDate': '',
                    'status.suspendDate': '',
                    'status.closeDate': '',
                }
            });
        }

        SavingAcc.update({_id: doc.savingAccId}, {$set: {savingNumber: transactionCount}});

    });
});
