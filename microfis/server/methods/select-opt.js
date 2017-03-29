import {check} from 'meteor/check';
import math from 'mathjs';
import {LoanAcc} from '../../../microfis/common/collections/loan-acc';


Meteor.methods({
    microfis_clientAccOpt: function (branchId) {
        let arr = [];
        // let loanList = LoanAcc.find({branchId: branchId, status: {$ne: "Close"}}).fetch();
        let loanList = LoanAcc.aggregate([
            {
                $lookup: {
                    from: "microfis_client",
                    localField: "clientId",
                    foreignField: "_id",
                    as: "clientDoc"
                }
            },
            {$unwind: {path: "$clientDoc", preserveNullAndEmptyArrays: true}}
        ])

        loanList.forEach(function (obj) {
            arr.push({
                label: obj._id + " : " + obj.clientDoc.khSurname + " " + obj.clientDoc.khNickname,
                value: obj._id
            });
        })
        return arr;
    }
})