import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';
import {Client} from '../../common/collections/client';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';
import {Setting} from '../../../core/common/collections/setting.js';
import ClassCompareAccount from "../../imports/libs/classCompareAccount"


export const makeWriteOffEnsure = new ValidatedMethod({
    name: 'microfis.makeWriteOffEnsure',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true},
        isEnsure: {type: Boolean}
    }).validator(),
    run({loanAccId, opts, isEnsure}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            if (isEnsure == true) {
                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {

                    let loanAcc = LoanAcc.findOne(loanAccId);
                    let clientDoc = Client.findOne({_id: loanAcc.clientId});
                    let dataForAccount = {};

                    dataForAccount.journalDate = opts['writeOff.writeOffDate'];
                    dataForAccount.branchId = loanAcc.branchId;
                    dataForAccount.voucherId = "";
                    dataForAccount.currencyId = loanAcc.currencyId;
                    dataForAccount.memo = "Write Off " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                    dataForAccount.refId = loanAcc._id;
                    dataForAccount.refFrom = "Write Off Ensure";
                    dataForAccount.total = opts['writeOff.amount'];

                    let transaction = [];

                    let acc_lessReservesForSpecific = MapClosing.findOne({chartAccountCompare: "Less Reserves for Specific"});
                    let acc_principal = ClassCompareAccount.checkPrincipal(loanAcc, "004");

                    /*let acc_feeOnPayment = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});
                     let acc_interest = ClassCompareAccount.checkInterest(loanAcc, "008");*/


                    transaction.push(
                        {
                            account: acc_lessReservesForSpecific.accountDoc.code + " | " + acc_lessReservesForSpecific.accountDoc.name,
                            dr: opts['writeOff.amount'],
                            cr: 0,
                            drcr: opts['writeOff.amount']

                        }, {
                            account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                            dr: 0,
                            cr: opts['writeOff.amount'],
                            drcr: -opts['writeOff.amount']
                        });


                    dataForAccount.transaction = transaction;
                    Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                        if (err) {
                            console.log(err.message);
                        }
                    })
                }
            } else {
                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {

                    let loanAcc = LoanAcc.findOne(loanAccId);
                    let clientDoc = Client.findOne({_id: loanAcc.clientId});
                    let dataForAccount = {};

                    dataForAccount.journalDate = opts.paymentWriteOff[opts.paymentWriteOff.length - 1].rePaidDate;
                    dataForAccount.branchId = loanAcc.branchId;
                    dataForAccount.voucherId = "";
                    dataForAccount.currencyId = loanAcc.currencyId;
                    dataForAccount.memo = "Repayment Write Off " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                    dataForAccount.refId = loanAcc._id;
                    dataForAccount.refFrom = "Repayment Write Off";
                    dataForAccount.total = opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest;

                    let transaction = [];

                    let acc_lessReservesForSpecific = MapClosing.findOne({chartAccountCompare: "Less Reserves for Specific"});
                    // let acc_principal = ClassCompareAccount.checkPrincipal(loanAcc, "004");
                    let acc_interest = ClassCompareAccount.checkInterest(loanAcc, "008");
                    let acc_feeOnPayment = MapClosing.findOne({chartAccountCompare: "Fee On Operation"});
                    let acc_Cash = MapClosing.findOne({chartAccountCompare: "Cash"});


                    transaction.push({
                            account: acc_Cash.accountDoc.code + " | " + acc_Cash.accountDoc.name,
                            dr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].feeOnPayment,
                            cr: 0,
                            drcr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].feeOnPayment
                        },
                        {
                            account: acc_lessReservesForSpecific.accountDoc.code + " | " + acc_lessReservesForSpecific.accountDoc.name,
                            dr: 0,
                            cr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount,
                            drcr: -opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount
                        }, {
                            account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                            dr: 0,
                            cr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest,
                            drcr: -opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest
                        }, {
                            account: acc_feeOnPayment.accountDoc.code + " | " + acc_feeOnPayment.accountDoc.name,
                            dr: 0,
                            cr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].feeOnPayment,
                            drcr: -opts.paymentWriteOff[opts.paymentWriteOff.length - 1].feeOnPayment
                        });


                    dataForAccount.transaction = transaction;
                    Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                        if (err) {
                            console.log(err.message);
                        }
                    })
                }
            }
            return LoanAcc.direct.update({_id: loanAccId}, {
                $set: opts
            });

        }
    }
});
