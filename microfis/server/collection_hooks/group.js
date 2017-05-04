import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Group} from '../../common/collections/group';
import {GroupLoan} from '../../common/collections/groupLoan';

Group.before.insert(function (userId, doc) {
    let prefix = moment(doc.date).format("YYYY");
    doc._id = idGenerator2.genWithPrefix(Group, {
        prefix: prefix,
        length: 6
    });
});

Group.after.update(function (userId, doc, fieldNames, modifier, options) {
    GroupLoan.direct.update({groupId: doc._id}, {
            $set: {
                groupName: doc.name
            },

        },
        {
            multi: true
        }
    )
})


