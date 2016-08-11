import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {RepaymentSchedule} from '../../imports/api/collections/repayment-schedule.js';

Meteor.publish('microfis.scheduleByDisbursementId', function microfisSchedule(disbursementId) {
    this.unblock();
    
    new SimpleSchema({
        disbursementId: {type: String}
    }).validate({disbursementId});

    if (this.userId) {
        let data = RepaymentSchedule.find({disbursementId: disbursementId}, {$sort: {index: 1}});

        return data;
    }

    return this.ready();
});
