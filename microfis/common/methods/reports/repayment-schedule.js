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
import {Sale} from '../../../common/collections/sale';
import {Purchase} from '../../../common/collections/purchase';
import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import LocationClass from "../../../imports/libs/getLocation";

export const repaymentScheduleReport = new ValidatedMethod({
    name: 'microfis.repaymentScheduleReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String}
    }).validator(),
    run({loanAccId}) {
        if (!this.isSimulation) {
            this.unblock();

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

            loanAccDoc.locationName = LocationClass.getLocationByVillage(loanAccDoc.locationId);

            data.header = loanAccDoc;

            let saleDoc=Sale.findOne({loanAccId: loanAccId});
            if(saleDoc != undefined){
                let purchseDoc=Purchase.findOne({_id: saleDoc.purchaseId});
                data.header.purchseDoc=purchseDoc;
            }else {
                data.header.purchseDoc={
                    itemName: ""
                };
            }

            console.log(data);
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
                            sumFeeOnPaymentDue: {$sum: "$feeOnPaymentDue"},
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
