import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';
import {Client} from '../../common/collections/client';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';
import {Setting} from '../../../core/common/collections/setting.js';
import {ProductStatus} from '../../common/collections/productStatus';

import {checkRepayment} from '../../common/methods/check-repayment.js';

import ClassCompareAccount from "../../imports/libs/classCompareAccount";

export const makeWaived = new ValidatedMethod({
    name: 'microfis.makeWaived',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            let settingDoc = Setting.findOne();
            if (settingDoc.integrate == true) {

                let loanAcc = LoanAcc.findOne(loanAccId);
                let clientDoc = Client.findOne({_id: loanAcc.clientId});
                let dataForAccount = {};

                dataForAccount.journalDate = opts['waived.waivedDate'];
                dataForAccount.branchId = loanAcc.branchId;
                dataForAccount.voucherId = "";
                dataForAccount.currencyId = loanAcc.currencyId;
                dataForAccount.memo = "Waived " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                dataForAccount.refId = loanAcc._id;
                dataForAccount.refFrom = "Waived";
                dataForAccount.total = opts['waived.amount'];

                let transaction = [];

                let checkPayment = checkRepayment.run({loanAccId: loanAccId, checkDate: opts['waived.waivedDate']});
                let productStatusList;
                if (loanAcc.paymentMethod == "D") {
                    if (loanAcc.term <= 365) {
                        productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                    } else {
                        productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                    }

                } else if (loanAcc.paymentMethod == "W") {
                    if (loanAcc.term <= 52) {
                        productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                    } else {
                        productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                    }
                } else if (loanAcc.paymentMethod == "M") {
                    if (loanAcc.term <= 12) {
                        productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                    } else {
                        productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                    }
                } else {
                    productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                }

                let finProductStatus = function (obj) {
                    return (checkPayment.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPayment.totalScheduleDue.numOfDayLate) >= obj.from && (checkPayment.totalScheduleDue.numOfDayLate < 0 ? 0 : checkPayment.totalScheduleDue.numOfDayLate) <= obj.to;
                }

                let proStatus = productStatusList.find(finProductStatus);

                let acc_waivedForDeathExpense = MapClosing.findOne({chartAccountCompare: "Waived For Death"});
                let acc_principal = ClassCompareAccount.checkPrincipal(loanAcc, proStatus._id);
                let acc_interest = ClassCompareAccount.checkInterest(loanAcc, proStatus._id);
                let acc_adminFee = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});

                transaction.push({
                        account: acc_waivedForDeathExpense.accountDoc.code + " | " + acc_waivedForDeathExpense.accountDoc.name,
                        dr: opts['waived.amount'] + opts['waived.interest'] + opts['waived.feeOnPayment'],
                        cr: 0,
                        drcr: opts['waived.amount'] + opts['waived.interest'] + opts['waived.feeOnPayment']

                    }, {
                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                        dr: 0,
                        cr: opts['waived.amount'],
                        drcr: -opts['waived.amount']
                    },
                    {
                        account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                        dr: 0,
                        cr: opts['waived.interest'],
                        drcr: -opts['waived.interest']
                    },
                    {
                        account: acc_adminFee.accountDoc.code + " | " + acc_adminFee.accountDoc.name,
                        dr: 0,
                        cr: opts['waived.feeOnPayment'],
                        drcr: -opts['waived.feeOnPayment']
                    }
                );


                dataForAccount.transaction = transaction;
                Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                    if (err) {
                        console.log(err.message);
                    }
                })
            }
            return LoanAcc.direct.update({_id: loanAccId}, {
                $set: opts
            },{multi: true});

        }
    }
});






