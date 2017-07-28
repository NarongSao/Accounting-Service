import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LookupValue} from '../../common/collections/lookup-value.js';

Meteor.publish('microfis.lookupValue', function microfisLookupValue() {
    this.unblock();

    if (this.userId) {
        let data = LookupValue.find();
        return data;
    }

    this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.lookupValue", LookupValue);