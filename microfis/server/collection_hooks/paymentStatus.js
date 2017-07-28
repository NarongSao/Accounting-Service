import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {PaymentStatus} from '../../common/collections/paymentStatus.js';

PaymentStatus.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(PaymentStatus, {length: 3});
});
