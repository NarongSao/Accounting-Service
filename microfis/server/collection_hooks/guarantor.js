import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Guarantor} from '../../imports/api/collections/guarantor.js';

Guarantor.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator2.genWithPrefix(Guarantor, {
        prefix: prefix,
        length: 6
    });
});
