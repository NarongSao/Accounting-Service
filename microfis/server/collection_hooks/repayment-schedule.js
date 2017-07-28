import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

RepaymentSchedule.before.insert(function (userId, doc) {
    let prefix = `${doc.loanAccId}-`;
    doc._id = idGenerator2.genWithPrefix(RepaymentSchedule, {
        prefix: prefix,
        length: 4
    });
});
