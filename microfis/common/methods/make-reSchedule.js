import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

export const makeReSchedule = new ValidatedMethod({
    name: 'microfis.makeReSchedule',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            let data = LoanAcc.findOne({_id: loanAccId}, {_id: 0});

            data.disbursementDate = opts.disbursementDate;
            data.loanAmount = opts.loanAmount;
            data.term = opts.term;
            data.firstRepaymentDate = opts.firstRepaymentDate;
            data.dueDateOn = opts.dueDateOn;
            data.parentId = loanAccId;

            data.paymentNumber = 0;
            data.feeAmount=0;

            data.repaidFrequency = opts.repaidFrequency;
            data.principalInstallment = opts.principalInstallment;

            let id = LoanAcc.insert(data);
            LoanAcc.direct.update({_id: loanAccId}, {
                $set: {
                    status: "Restructure",
                    restructureDate: opts.disbursementDate
                }
            });

            return id;

        }
    }
});