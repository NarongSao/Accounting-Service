import {check} from 'meteor/check';
import math from 'mathjs';
import {Fee} from '../../common/collections/fee';


Meteor.methods({
    microfis_feeCalculate: function (loanDoc) {

        let amount = 0
        let data = Fee.find({_id: {$in: loanDoc.productDoc.feeId}}).fetch();

        data.forEach(function (obj) {
            if (obj.calculateType == "P") {
                amount += (obj.amount / 100) * loanDoc.loanAmount;
            } else {
                if (loanDoc.currencyId == "KHR") {
                    amount += obj.amount * loanDoc.productDoc.exchange.KHR;

                } else if (loanDoc.currencyId == "THB") {
                    amount += obj.amount * loanDoc.productDoc.exchange.THB;

                } else {
                    amount += obj.amount;
                }
            }
        })

        return amount;
    },
    microfis_feeOnPaymentCalculate: function (disbursement, amount, principal, interest, currencyId, productDoc) {

        let fee = 0;
        let data = Fee.find({_id: {$in: productDoc.feeOnPaymentId}}).fetch();

        if (data) {
            data.forEach(function (obj) {
                if (obj.feeTypeOf == "Disbursement") {
                    fee += feeOnPayment(obj.calculateType, disbursement, obj.amount, currencyId, productDoc);

                } else if (obj.feeTypeOf == "Amount Paid") {
                    fee += feeOnPayment(obj.calculateType, amount, obj.amount, currencyId, productDoc);
                }
                else if (obj.feeTypeOf == "Principal Paid") {
                    fee += feeOnPayment(obj.calculateType, principal, obj.amount, currencyId, productDoc);
                }
                else if (obj.feeTypeOf == "Interest Paid") {
                    fee += feeOnPayment(obj.calculateType, interest, obj.amount, currencyId, productDoc);
                }
            })
        }
        return fee;
    }
})

let feeOnPayment = function (calculateType, amount, feeAmount, currencyId, productDoc) {
    let fee = 0;
    if (calculateType == "P") {
        fee = (feeAmount / 100) * amount;
    } else {
        if (currencyId == "KHR") {
            fee = feeAmount * productDoc.exchange.KHR;

        } else if (currencyId == "THB") {
            fee = feeAmount * productDoc.exchange.THB;

        } else {
            fee = feeAmount;
        }
    }
    return fee;
}