import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';
import math from 'mathjs';

// Collection
import {SavingAcc} from '../../common/collections/saving-acc';
import {SavingProduct} from '../../common/collections/saving-product.js';
import {SavingTransaction} from '../../common/collections/saving-transaction.js';

// Before insert
SavingAcc.before.insert(function (userId, doc) {
    let prefix = `${doc.clientId}-${doc.productId}`;
    doc._id = idGenerator2.genWithPrefix(SavingAcc, {
        prefix: prefix,
        length: 3
    });
});

