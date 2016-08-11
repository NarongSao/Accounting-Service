import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Repayment} from '../../imports/api/collections/repayment.js';

export const getLastRepaymentByDisbursementId = new ValidatedMethod({
    name: 'microfis.getLastRepaymentByDisbursementId',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        disbursementId: {type: String}
    }).validator(),
    run({disbursementId}) {
        if (!this.isSimulation) {
            let data = Repayment.findOne(
                {disbursementId: disbursementId},
                {$sort: {_id: -1}}
            );
            
            return data;
        }
    }
});