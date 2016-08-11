import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Disbursement} from '../../imports/api/collections/disbursement.js';
import {Repayment} from '../../imports/api/collections/repayment.js';
import {RepaymentSchedule} from '../../imports/api/collections/repayment-schedule.js';

// Before insert
Repayment.before.insert(function (userId, doc) {
    let prefix = doc.disbursementId + '-';
    doc._id = idGenerator2.genWithPrefix(Repayment, {
        prefix: prefix,
        length: 6
    });
});

// After insert
Repayment.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        // Update schedule
        let schedulePaid = doc.detailDoc.schedulePaid;

        _.forEach(schedulePaid, (o)=> {
            o.repaymentId = doc._id;

            RepaymentSchedule.update({_id: o.scheduleId}, {
                $inc: {
                    'repaymentDoc.totalPrincipalPaid': o.principalPaid,
                    'repaymentDoc.totalInterestPaid': o.interestPaid,
                    'repaymentDoc.totalPenaltyPaid': o.penaltyPaid,
                    'repaymentDoc.totalInterestWaived': o.interestWaived,
                },
                $push: {'repaymentDoc.detail': o}
            });
        });

        // Update disbursement for close type
        if (doc.type == 'close') {
            // Set close status on disbursement
            Disbursement.direct.update({_id: doc.disbursementId}, {$set: {closeDate: doc.repaidDate}});
        }

    });
});

// After remove
Repayment.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        // Update schedule
        let schedulePaid = doc.detailDoc.schedulePaid;

        _.forEach(schedulePaid, (o)=> {
            RepaymentSchedule.update({_id: o.scheduleId}, {
                $inc: {
                    'repaymentDoc.totalPrincipalPaid': -o.principalPaid,
                    'repaymentDoc.totalInterestPaid': -o.interestPaid,
                    'repaymentDoc.totalPenaltyPaid': -o.penaltyPaid,
                    'repaymentDoc.totalInterestWaived': -o.interestWaived,
                },
                $pull: {'repaymentDoc.detail': {repaymentId: doc._id}}
            });
        });

        // Update disbursement for close type
        if (doc.type == 'close') {
            // Set close status on disbursement
            Disbursement.direct.update({_id: doc.disbursementId}, {$unset: {closeDate: ''}});
        }
    });
});
