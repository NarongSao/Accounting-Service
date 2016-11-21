import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

import {updateLoanAccStatus} from '../../common/methods/update-LoanAccStatus.js'

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

export const removeWriteOffEnsure = new ValidatedMethod({
    name: 'microfis.removeWriteOffEnsure',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            let isUpdate= LoanAcc.direct.update({_id: loanAccId}, {
                $unset: opts
            });

            if(isUpdate){
               return updateLoanAccStatus.callPromise({
                   loanAccId: loanAccId
                }).then(function (result) {

                }).catch(function (err) {
                    console.log(err.message);
                });
            }


        }
    }
});