import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {SavingProduct} from '../../imports/api/collections/saving-product.js';

SavingProduct.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(SavingProduct, {length: 3});
});
