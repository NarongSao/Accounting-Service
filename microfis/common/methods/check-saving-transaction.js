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
import {roundCurrency} from '../libs/round-currency.js';

// Method
import {Calculate} from '../libs/calculate.js';
import {lookupSavingAcc} from './lookup-saving-acc.js';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction';

export let checkSavingTransaction = new ValidatedMethod({
    name: 'microfis.checkSavingTransaction',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        savingAccId: {
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
    run({savingAccId, checkDate, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            // Get saving acc and last transaction
            let savingAccDoc = lookupSavingAcc.call({savingAccId: savingAccId}),
                lastTransaction = SavingTransaction.findOne(
                    {
                        savingAccId: savingAccId,
                        transactionDate: {$lte: moment(checkDate).endOf("day").toDate()}
                    },
                    {sort: {_id: -1}}
                );

            //---------------------------

            // Set data to return
            let data = {
                lastTransactionId: null,
                lastTransactionDate: savingAccDoc.accDate,
                numOfDay: 0,
                principalOpening: new BigNumber(0),
                interestOpening: new BigNumber(0),
                currentInterestAmount: new BigNumber(0),
                interestBal: new BigNumber(0),
                lastTransaction: lastTransaction
            };

            // Check last transaction
            if (lastTransaction) {
                data.lastTransactionId = lastTransaction._id;
                data.lastTransactionDate = lastTransaction.transactionDate;
                data.principalOpening = new BigNumber(lastTransaction.details.principalBal);
                data.interestOpening = new BigNumber(lastTransaction.details.interestBal);
            }

            data.numOfDay = moment(checkDate).startOf('day').diff(moment(data.lastTransactionDate).startOf('day'), 'days');
            if (data.numOfDay > 0 && data.principalOpening > 0) {
                let interest = Calculate.interest.call({
                    amount: data.principalOpening.toNumber(),
                    numOfDay: data.numOfDay,
                    interestRate: savingAccDoc.interestRate,
                    method: savingAccDoc.productDoc.interestMethod,
                    dayInMethod: savingAccDoc.productDoc.daysInMethod,
                    currencyId: savingAccDoc.currencyId,
                });

                data.currentInterestAmount = new BigNumber(interest);
            }

            // Cal interest bal
            data.interestBal = data.interestOpening.plus(data.currentInterestAmount);

            // Convert big number
            data.principalOpening = data.principalOpening.toNumber();
            data.interestOpening = data.interestOpening.toNumber();
            data.currentInterestAmount = data.currentInterestAmount.toNumber();
            data.interestBal = data.interestBal.toNumber();

            return data;
        }
    }
});
