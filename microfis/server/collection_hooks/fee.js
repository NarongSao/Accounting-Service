import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Fee} from '../../imports/api/collections/fee.js';

Fee.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(Fee, {length: 3});
});
