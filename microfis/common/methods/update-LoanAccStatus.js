import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

export const updateLoanAccStatus = new ValidatedMethod({
    name: 'microfis.updateLoanAccStatus',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);


            let doc = LoanAcc.findOne({_id: loanAccId});
            if (doc.writeOffDate != null) {
                if (doc.restructureDate != null) {
                    if (doc.writeOffDate.getTime() > doc.restructureDate.getTime()) {

                        LoanAcc.direct.update({_id: loanAccId}, {
                            $set: {status: "Write Off"}
                        });

                    } else {

                        LoanAcc.direct.update({_id: loanAccId}, {
                            $set: {status: "Restructure"}
                        });
                    }
                } else {

                    LoanAcc.direct.update({_id: loanAccId}, {
                        $set: {status: "Write Off"}
                    });
                }
            } else if (doc.restructureDate != null) {
                LoanAcc.direct.update({_id: loanAccId}, {
                    $set: {status: "Restructure"}
                });
            } else {
                LoanAcc.direct.update({_id: loanAccId}, {
                    $set: {status: "Active"}
                });
            }
        }

    }

});