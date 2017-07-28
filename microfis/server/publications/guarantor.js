import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Guarantor} from '../../common/collections/guarantor.js';

Meteor.publish('microfis.guarantor', function microfisGuarantor(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Guarantor.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.guarantor", Guarantor);