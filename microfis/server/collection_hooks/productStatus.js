import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {ProductStatus} from '../../common/collections/productStatus.js';

ProductStatus.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(ProductStatus, {length: 3});
});
