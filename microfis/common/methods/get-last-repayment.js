import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

export const getLastRepayment = new ValidatedMethod({
    name: 'microfis.getLastRepayment',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String}
    }).validator(),
    run({loanAccId}) {
        if (!this.isSimulation) {
            return Repayment.findOne({loanAccId: loanAccId}, {$sort: {_id: -1}});
        }
    }
});