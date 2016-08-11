import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {PenaltyClosing} from '../../imports/api/collections/penalty-closing.js';

PenaltyClosing.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(PenaltyClosing, {length: 3});
});
