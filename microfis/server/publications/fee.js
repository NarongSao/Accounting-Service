import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Fee} from '../../imports/api/collections/fee.js';

Meteor.publish('microfis.fee', function microfisFee(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Fee.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.fee", Fee);