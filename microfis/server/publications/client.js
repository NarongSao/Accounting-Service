import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Client} from '../../common/collections/client.js';

Meteor.publish('microfis.client', function microfisClient(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Client.find(selector, options);

        return data;
    }

    return this.ready();
});

Meteor.publish('microfis.clientById', function microfisClientById(id) {
    this.unblock();
    Meteor._sleepForMs(100);

    new SimpleSchema({
        id: {type: String}
    }).validate({id});

    if (this.userId) {
        return Client.find({_id: id});
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.client", Client);