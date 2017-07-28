import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {CreditOfficer} from '../../common/collections/credit-officer.js';

CreditOfficer.before.insert(function (userId, doc) {
    let prefix = doc.branchId + '-';
    doc._id = idGenerator2.genWithPrefix(CreditOfficer, {
        prefix: prefix,
        length: 4
    });
});
