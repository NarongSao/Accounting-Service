import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';

Meteor.publish('microfis.endOfProcess', function microfisEndOfProcess(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = EndOfProcess.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.endOfProcess", EndOfProcess);