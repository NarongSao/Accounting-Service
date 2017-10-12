import {check} from 'meteor/check';
import math from 'mathjs';
import {Repayment} from '../../common/collections/repayment.js';
Meteor.methods({
    microfis_getloanAccIdList: function (detailPaid, closeDate) {
        let repaymentIdList = [];
        let loanIdList = [];

        if (detailPaid && detailPaid.length > 0) {
            repaymentIdList = detailPaid.map(function (obj) {
                return obj.repaymentId;
            })
        }
        loanIdList = Repayment.find({
            _id: {$in: repaymentIdList},
            //repaidDate: {$gte: moment(closeDate).startOf("day").toDate()}
        }).map(function (obj) {
            return obj.loanAccId;
        })
        return loanIdList;

    },
    microfis_checkRepaymentExistOfClearPrepay: function (detailPaid, closeDate) {
        let repaymentIdList = [];
        let loanIdList = [];

        if (detailPaid && detailPaid.length > 0) {
            repaymentIdList = detailPaid.map(function (obj) {
                return obj.repaymentId;
            })
        }
        loanIdList = Repayment.find({
            _id: {$in: repaymentIdList}
        }).map(function (obj) {
            return obj.loanAccId;
        })

        let repaidList = Repayment.find({
            loanAccId: {$in: loanIdList},
            repaidDate: {$gte: moment(closeDate).startOf("day").toDate()}
        }).fetch();

        return repaidList.length;
    }
})