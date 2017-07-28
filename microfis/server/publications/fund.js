import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Fund} from '../../common/collections/fund.js';

Meteor.publish('microfis.fund', function microfisFund(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Fund.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.fund", Fund);