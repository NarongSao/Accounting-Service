import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';


// Collection
import {GroupLoan} from '../../common/collections/groupLoan';

Meteor.publish('microfis.groupLoan', function groupLoan(selector = {}, options = {}) {
    if (this.userId) {
        let data = GroupLoan.find(selector, options);
        return data;
    }

    return this.ready();
});
