import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {PublishRelations} from 'meteor/cottz:publish-relations';

// Collection
import {Product} from '../../imports/api/collections/product.js';
import {Penalty} from '../../imports/api/collections/penalty.js';

Meteor.publish('microfis.product', function microfisProduct(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Product.find(selector, options);

        return data;
    }

    return this.ready();
});

// Reactive Table
ReactiveTable.publish("microfis.reactiveTable.product", Product);
