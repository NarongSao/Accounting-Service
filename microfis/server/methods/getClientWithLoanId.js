import {check} from 'meteor/check';
import math from 'mathjs';
import {Client} from '../../../microfis/common/collections/client';
import {LoanAcc} from '../../../microfis/common/collections/loan-acc';
Meteor.methods({
    microfis_getClientWithLoanId: function (branchId) {
        return Client.aggregate([
            {$match: {branchId: branchId}},
            {
                $lookup: {
                    from: "microfis_loanAcc",
                    localField: "_id",
                    foreignField: "clientId",
                    as: "loanDoc"
                }
            },
            {$unwind: {path: "$loanDoc", preserveNullAndEmptyArrays: true}}

        ])

    }
})