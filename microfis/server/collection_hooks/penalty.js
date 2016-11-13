import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Penalty} from '../../common/collections/penalty.js';

Penalty.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(Penalty, {length: 3});
});
