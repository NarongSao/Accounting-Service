import {Meteor} from 'meteor/meteor';
import {SavingTransaction} from '../../common/collections/saving-transaction';

Meteor.startup(function () {
    SavingTransaction._ensureIndex({voucherId: 1, branchId: 1}, {sparse: 1, unique: 1});
});
