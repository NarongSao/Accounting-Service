import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import math from 'mathjs';

// Collection
import {SavingTransaction} from '../../imports/api/collections/saving-transaction';

// Before insert
SavingTransaction.before.insert(function (userId, doc) {
    let prefix = doc.savingAccId + '-';
    doc._id = idGenerator2.genWithPrefix(SavingTransaction, {
        prefix: prefix,
        length: 6
    });
});
