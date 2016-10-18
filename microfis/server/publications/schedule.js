import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {RepaymentSchedule} from '../../imports/api/collections/repayment-schedule.js';

Meteor.publish('microfis.scheduleByLoanAccId', function microfisScheduleByLoanAccId(loanAccId) {
    this.unblock();

    new SimpleSchema({
        loanAccId: {type: String}
    }).validate({loanAccId});

    if (!this.userId) {
        return this.ready();
    }

    return RepaymentSchedule.find({loanAccId: loanAccId}, {$sort: {installment: 1}});
});
