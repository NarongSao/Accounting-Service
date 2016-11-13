import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {SavingAcc} from '../../common/collections/saving-acc';

Meteor.publish('microfis.savingAccById', function microfisSavingAccById(savingAccId) {
    this.unblock();

    new SimpleSchema({
        savingAccId: {type: String},
    }).validate({savingAccId});

    if (!this.userId) {
        return this.ready();
    }
    Meteor._sleepForMs(100);

    return SavingAcc.find({_id: savingAccId});
});
