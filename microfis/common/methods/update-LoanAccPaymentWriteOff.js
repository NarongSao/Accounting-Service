import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

export const updateLoanAccPaymentWrteOff = new ValidatedMethod({
    name: 'microfis.updateLoanAccPaymentWrteOff',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true},
        repaidDate: {type: Date}
    }).validator(),
    run({loanAccId, opts, repaidDate}) {
        if (!this.isSimulation) {
            if (opts.status == 'Write Off') {

                let updatePaymentArray = {};
                let paymentArray = opts.paymentWriteOff;
                let paymentWriteOff = [];
                paymentArray.forEach(function (obj) {
                    if (obj.rePaidDate.getTime() !== repaidDate.getTime()) {
                        paymentWriteOff.push(obj);
                    }
                })
                updatePaymentArray.paymentWriteOff = paymentWriteOff;
                return LoanAcc.direct.update({_id: loanAccId}, {$set: updatePaymentArray});
            }
        }
    }
});