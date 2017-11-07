import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Vendor} from '../../common/collections/vendor';

Meteor.publish('microfis.vendor', function microfisVendor(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Vendor.find(selector, options);

        return data;
    }

    return this.ready();
});
