import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction';

Meteor.publish('microfis.savingTransactionById', function microfisSavingTransactionById(savingTransactionId) {
    this.unblock();

    new SimpleSchema({
        savingTransactionId: {type: String},
    }).validate({savingTransactionId});

    if (!this.userId) {
        return this.ready();
    }
    Meteor._sleepForMs(100);

    return SavingTransaction.find({_id: savingTransactionId});
});
