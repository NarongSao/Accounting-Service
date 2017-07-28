import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {ClearPrepay} from '../../common/collections/clearPrepay';

Meteor.publish('microfis.clearPrepay', function microfisClearPrepay(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = ClearPrepay.find(selector, options);

        return data;
    }

    return this.ready();
});
