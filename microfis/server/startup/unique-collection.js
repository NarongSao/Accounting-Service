import {Meteor} from 'meteor/meteor';
import {SavingTransaction} from '../../common/collections/saving-transaction';
import {Client} from '../../common/collections/client.js';
import {EndOfProcess} from '../../common/collections/endOfProcess.js';
import {Repayment} from '../../common/collections/repayment.js';


Meteor.startup(function () {
    SavingTransaction._ensureIndex({
        voucherId: 1,
        branchId: 1,
        transactionType: 1,
        currencyId: 1,
        endId: 1
    }, {
        sparse: 1,
        unique: 1
    });

    Client._ensureIndex({idType: 1, idNumber: 1, uniqueByCondition: 1, branchId: 1}, {unique: 1});
    EndOfProcess._ensureIndex({month: 1, branchId: 1, year: 1, day: 1}, {unique: 1});
    Repayment._ensureIndex({voucherId: 1, currencyId: 1, branchId: 1}, {unique: 1});


});
