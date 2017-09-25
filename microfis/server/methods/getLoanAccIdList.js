import {check} from 'meteor/check';
import math from 'mathjs';
import {Repayment} from '../../common/collections/repayment.js';
Meteor.methods({
    microfis_getloanAccIdList: function (detailPaid, closeDate) {
        let repaymentIdList = [];
        let loanIdList = [];

        if (detailPaid.length > 0) {
            repaymentIdList = detailPaid.map(function (obj) {
                return obj.repaymentId;
            })
        }
        console.log(closeDate);
        loanIdList = Repayment.find({
            _id: {$in: repaymentIdList},
            //repaidDate: {$gte: moment(closeDate).startOf("day").toDate()}
        }).map(function (obj) {
            return obj.loanAccId;
        })
        console.log(loanIdList);
        return loanIdList;
    }
})