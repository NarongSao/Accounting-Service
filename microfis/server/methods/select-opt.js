import {check} from 'meteor/check';
import math from 'mathjs';
import {LoanAcc} from '../../../microfis/common/collections/loan-acc';


Meteor.methods({
    microfis_clientAccOpt: function (branchId) {
        let arr = [];
        arr.push({label: "(Select One)", value: ""});
        // let loanList = LoanAcc.find({branchId: branchId, status: {$ne: "Close"}}).fetch();
        let loanList = LoanAcc.aggregate([
            {$match: {branchId: branchId, status: {$nin: ["Close", "Restructure"]}}},
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
                label: obj._id + " : " + obj.clientDoc.khSurname + " " + obj.clientDoc.khGivenName + "    " + moment(obj.disbursementDate).format("DD/MM/YYYY"),
                value: obj._id
            });
        })
        return arr;
    },
    microfis_clientAccGroupOpt: function (branchId, locationId) {
        let arr = [];
        // let loanList = LoanAcc.find({branchId: branchId, status: {$ne: "Close"}}).fetch();

        arr.push({label: "(Select One)", value: ""});
        let loanList = LoanAcc.aggregate([
            {
                $match: {
                    branchId: branchId,
                    accountType: "GL",
                    locationId: locationId,
                    isAddToGroup: false,
                    status: {$nin: ["Close", "Restructure"]}
                }
            },
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
                label: obj._id + " : " + obj.clientDoc.khSurname + " " + obj.clientDoc.khGivenName + "    " + moment(obj.disbursementDate).format("DD/MM/YYYY"),
                value: obj._id
            });
        })
        return arr;
    },
    microfis_clientAccAllGroupOpt: function (branchId, locationId) {
        let arr = [];
        // let loanList = LoanAcc.find({branchId: branchId, status: {$ne: "Close"}}).fetch();

        arr.push({label: "(Select One)", value: ""});
        let loanList = LoanAcc.aggregate([
            {
                $match: {
                    branchId: branchId,
                    accountType: "GL",
                    locationId: locationId,
                    status: {$nin: ["Close", "Restructure"]}
                }
            },
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
                label: obj._id + " : " + obj.clientDoc.khSurname + " " + obj.clientDoc.khGivenName + "    " + moment(obj.disbursementDate).format("DD/MM/YYYY"),
                value: obj._id
            });
        })
        return arr;
    }

})