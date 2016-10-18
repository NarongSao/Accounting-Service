import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Fund} from '../../common/collections/fund.js';

Fund.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(Fund, {length: 3});
});
