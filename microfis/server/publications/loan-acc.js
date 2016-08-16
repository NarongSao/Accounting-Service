import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../imports/api/collections/loan-acc.js';

Meteor.publish('microfis.loanAccById', function microfisLoanAccById(loanAccId) {
    this.unblock();

    new SimpleSchema({
        loanAccId: {type: String},
    }).validate({loanAccId});

    if (!this.userId) {
        return this.ready();
    }
    Meteor._sleepForMs(100);

    return LoanAcc.find({_id: loanAccId});
});
