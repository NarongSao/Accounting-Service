import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/common/collections/company.js';
import {Branch} from '../../../../core/common/collections/branch.js';
import {LoanAcc} from '../../../common/collections/loan-acc.js';
import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';

export const repaymentScheduleReport = new ValidatedMethod({
    name: 'microfis.repaymentScheduleReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String}
    }).validator(),
    run({loanAccId}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            let data = {
                title: {},
                header: {},
                content: [{index: 'No Result'}],
                footer: {}
            };

            let loanAccDoc = lookupLoanAcc.call({_id: loanAccId});

            /****** Title *****/
            data.title.company = Company.findOne();
            data.title.branch = Branch.findOne(loanAccDoc.branchId);

            /****** Header *****/
            if (loanAccDoc.principalInstallment.calculateType == "P") {
                loanAccDoc.isPercentage = true;
            } else {
                loanAccDoc.isPercentage = false;
            }

            data.header = loanAccDoc;

            /****** Content *****/
            let content = RepaymentSchedule.aggregate(
                [
                    {$match: {loanAccId: loanAccId}},
                    {$sort: {index: 1}},
                    {
                        $group: {
                            _id: {loanAccId: "$loanAccId", scheduleDate: "$scheduleDate"},
                            sumNumOfDay: {$sum: "$numOfDay"},
                            sumPrincipalDue: {$sum: "$principalDue"},
                            sumInterestDue: {$sum: "$interestDue"},
                            sumTotalDue: {$sum: "$totalDue"},
                            data: {$push: "$$ROOT"}
                        }
                    }
                ]);
            data.content = content[0];


            return data
        }
    }
});
