import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Product} from '../../imports/api/collections/product.js';

Product.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(Product, {length: 3});
});
