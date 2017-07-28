import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {PenaltyClosing} from '../../common/collections/penalty-closing.js';

Meteor.publish('microfis.penaltyClosing', function microfisPenaltyClosing(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = PenaltyClosing.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.penaltyClosing", PenaltyClosing);