import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Client} from '../../common/collections/client.js';

Client.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator2.genWithPrefix(Client, {
        prefix: prefix,
        length: 6
    });
});
