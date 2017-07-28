import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

export const getSchedule = new ValidatedMethod({
    name: 'microfis.getSchedule',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        scheduleDate: {type: Date, optional: true}
    }).validator(),
    run({loanAccId, scheduleDate}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            let data = RepaymentSchedule.find({loanAccId: loanAccId});
            return data.fetch();
        }
    }
});