import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {PaymentStatus} from '../../common/collections/paymentStatus';

Meteor.publish('microfis.paymentStatus', function microfisProductStatus(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = PaymentStatus.find(selector, options);

        return data;
    }

    return this.ready();
});
