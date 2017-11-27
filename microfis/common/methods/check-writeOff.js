import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';
import BigNumber from 'bignumber.js';
import {round2} from 'meteor/theara:round2';

// Lib
import {roundCurrency} from '../libs/round-currency';

// Method
import {Calculate} from '../libs/calculate';
import {lookupLoanAcc} from './lookup-loan-acc';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule';
import {Repayment} from '../../common/collections/repayment';

export let checkWriteOff = new ValidatedMethod({
    name: 'microfis.checkWriteOff',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {
            type: String
        },
        checkDate: {
            type: Date
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        },
    }).validator(),
    run({loanAccId, checkDate, opts}) {
        if (!this.isSimulation) {



            let loanAccDoc = lookupLoanAcc.call({_id: loanAccId});

            //---------------------------

            // Check currency
            let _round = {
                type: 'general',
                precision: -2 // KHR
            };
            switch (loanAccDoc.currencyId) {
                case 'USD':
                    _round.precision = 2;
                    break;
                case 'THB':
                    _round.precision = 0;
                    break;
            }
            let outStanding = {},
                paid = {},
                writeOff = {};

            if (loanAccDoc.writeOff != undefined) {
                paid.amount = 0;
                paid.interest = 0;
                paid.feeOnPayment = 0;
                paid.total = 0;

                loanAccDoc.paymentWriteOff.forEach(function (obj) {
                    if (obj.rePaidDate <= checkDate) {
                        paid.amount += round2(obj.amount || 0, _round.precision, _round.type);
                        paid.interest += round2(obj.interest || 0, _round.precision, _round.type);
                        paid.feeOnPayment += round2(obj.feeOnPayment || 0, _round.precision, _round.type);
                        paid.total += round2(obj.interest || 0, _round.precision, _round.type) + round2(obj.amount || 0, _round.precision, _round.type)+ round2(obj.feeOnPayment || 0, _round.precision, _round.type);

                        outStanding.amount = round2(obj.unPaidPrincipal || 0, _round.precision, _round.type);
                        outStanding.interest = round2(obj.unPaidInterest || 0, _round.precision, _round.type);
                        outStanding.feeOnPayment = round2(obj.unPaidFeeOnPayment || 0, _round.precision, _round.type);
                        outStanding.total = round2(obj.unPaidPrincipal || 0, _round.precision, _round.type) + round2(obj.unPaidInterest || 0, _round.precision, _round.type)+ round2(obj.unPaidFeeOnPayment || 0, _round.precision, _round.type);
                    }
                })

                writeOff.amount = round2(loanAccDoc.writeOff.amount || 0, _round.precision, _round.type);
                writeOff.interest = round2(loanAccDoc.writeOff.interest || 0, _round.precision, _round.type);
                writeOff.feeOnPayment = round2(loanAccDoc.writeOff.feeOnPayment || 0, _round.precision, _round.type);
                writeOff.total = round2(loanAccDoc.writeOff.amount || 0, _round.precision, _round.type) + round2(loanAccDoc.writeOff.interest || 0, _round.precision, _round.type)+ round2(loanAccDoc.writeOff.feeOnPayment || 0, _round.precision, _round.type);
            }


            return {
                outStanding: outStanding,
                paid: paid,
                writeOff: writeOff
            };
        }
    }
});
