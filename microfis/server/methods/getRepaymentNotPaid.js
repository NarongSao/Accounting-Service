import {check} from 'meteor/check';
import math from 'mathjs';
import {Repayment} from '../../common/collections/repayment.js';
Meteor.methods({
    microfis_getRepaymentNotPaid: function (branchId) {
        let notPaidDoc = {};
        notPaidDoc.notPaidList = [];
        notPaidDoc.count = 0;

        let customerList = Repayment.aggregate([
            {
                $match: {branchId: branchId, detailDoc: undefined, type: {$nin: ["Fee","Write Off"]}},
            },
            {
                $lookup: {
                    from: "microfis_loanAcc",
                    localField: "loanAccId",
                    foreignField: "_id",
                    as: "loanDoc"
                }
            },
            {$unwind: {path: "$loanDoc", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "microfis_client",
                    localField: "loanDoc.clientId",
                    foreignField: "_id",
                    as: "customerDoc"
                }
            },
            {$unwind: {path: "$customerDoc", preserveNullAndEmptyArrays: true}},
            {
                $group: {
                    _id: null,
                    data: {$push: "$$ROOT"},
                    count: {$sum: 1}
                }
            }
        ]);
        if (customerList.length > 0) {

            notPaidDoc.notPaidList = customerList[0].data;
            notPaidDoc.count = customerList[0].count;
        }
        return notPaidDoc;

    }
})