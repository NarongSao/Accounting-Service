import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Branch} from '../../../../core/imports/api/collections/branch.js';
import {Disbursement} from '../../../imports/api/collections/disbursement.js';
import {RepaymentSchedule} from '../../../imports/api/collections/repayment-schedule.js';

// Method
import  {lookupDisbursement} from '../lookup-disbursement.js';

export const repaymentScheduleReport = new ValidatedMethod({
    name: 'simplePos.repaymentScheduleReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        disbursementId: {type: String}
    }).validator(),
    run({disbursementId}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            let data = {
                title: {},
                header: {},
                content: [{index: 'No Result'}],
                footer: {}
            };

            let disbursementDoc = lookupDisbursement.call({_id: disbursementId});

            /****** Title *****/
            data.title.company = Company.findOne();
            data.title.branch = Branch.findOne(disbursementDoc.branchId);

            /****** Header *****/
            data.header = disbursementDoc;

            /****** Content *****/
            let content = RepaymentSchedule.aggregate(
                [
                    {$match: {disbursementId: disbursementId}},
                    {$sort: {index: 1}},
                    {
                        $group: {
                            _id: {disbursementId: "$disbursementId", scheduleDate: "$scheduleDate"},
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
