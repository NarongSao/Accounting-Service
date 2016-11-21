import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

export const makeWriteOffEnsure = new ValidatedMethod({
    name: 'microfis.makeWriteOffEnsure',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            return LoanAcc.direct.update({_id: loanAccId}, {
                $set: opts
            });

        }
    }
});