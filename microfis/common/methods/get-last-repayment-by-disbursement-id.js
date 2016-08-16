import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Repayment} from '../../imports/api/collections/repayment.js';

export const getLastRepaymentByLoanAccId = new ValidatedMethod({
    name: 'microfis.getLastRepaymentByLoanAccId',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String}
    }).validator(),
    run({loanAccId}) {
        if (!this.isSimulation) {
            let data = Repayment.findOne(
                {loanAccId: loanAccId},
                {$sort: {_id: -1}}
            );
            
            return data;
        }
    }
});