import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

// Method

import {lookupProduct} from '../../common/methods/lookup-product.js';
import {MakeSchedule} from '../../common/methods/make-schedule.js';

// Before insert
Repayment.before.insert(function (userId, doc) {
    let prefix = doc.loanAccId + '-';
    doc._id = idGenerator2.genWithPrefix(Repayment, {
        prefix: prefix,
        length: 6
    });
});

// After insert
Repayment.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        // Update schedule
        if (doc.detailDoc) {
            if (doc.detailDoc.schedulePaid) {
                let schedulePaid = doc.detailDoc.schedulePaid;

                _.forEach(schedulePaid, (o) => {
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
            }
        }


        // Update loan acc for close type
        if (doc.type == 'Close') {
            // Set close status on loan acc
            LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {closeDate: doc.repaidDate, status: "Close"}});
        }


        if (doc.type == "Reschedule") {
            _makeScheduleForPrincipalInstallment(doc);
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: 1}});
    });
});

// After remove
Repayment.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        // Update schedule
        if (doc.detailDoc) {
            if (doc.detailDoc.schedulePaid) {
                let schedulePaid = doc.detailDoc.schedulePaid;

                _.forEach(schedulePaid, (o) => {
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
            }
        }


        let loanDoc = LoanAcc.findOne({_id: doc.loanAccId});
        // Update loan acc for close type
        if (doc.type == 'Close') {
            // Set close status on loan acc
            LoanAcc.direct.update({_id: doc.loanAccId}, {$unset: {closeDate: ''}});

            if (loanDoc.writeOffDate != undefined) {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: 'Write Off'}});
            } else if (loanDoc.restructureDate != undefined) {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: 'Restructure'}});
            } else {
                LoanAcc.direct.update({_id: doc.loanAccId}, {$set: {status: "Active"}});
            }
        }

        

        if (doc.type == "Reschedule") {
            RepaymentSchedule.remove({scheduleDate: doc.repaidDate, loanAccId: doc.loanAccId});
        }

        LoanAcc.direct.update({_id: doc.loanAccId}, {$inc: {paymentNumber: -1}});


    });

});


// Create repayment schedule when principal installment
function _makeScheduleForPrincipalInstallment(doc) {


    let amount = doc.detailDoc.principalInstallment.principalReminder;
    let options = {};
    options.disbursementDate = doc.repaidDate;
    options.loanAmount = amount - doc.amountPaid;
    options.term = doc.detailDoc.scheduleNext.length;
    options.firstRepaymentDate = null;

    let i = 0;
    doc.detailDoc.scheduleNext.forEach(function (obj) {
        if (obj.allowClosing == true) {
            i++;
        }
    })
    options.installmentAllowClosing = options.term - i;

    let schedule = MakeSchedule.declinig.call({loanAccId: doc.loanAccId, options: options});

    let maturityDate, tenor = 0;

    _.forEach(schedule, (value, key) => {
        tenor += value.numOfDay;
        if (key == schedule.length - 1) {
            maturityDate = value.dueDate;
        }

        // Save to repayment schedule collection
        value.scheduleDate = doc.repaidDate;
        value.loanAccId = doc.loanAccId;
        RepaymentSchedule.insert(value);
    });

    // Update tenor, maturityDate on loan acc
    LoanAcc.direct.update({_id: doc._id}, {$set: {maturityDate: maturityDate, tenor: tenor}});
}