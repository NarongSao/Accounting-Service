import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Category} from '../../common/collections/category';

Meteor.publish('microfis.category', function microfisCategory(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Category.find(selector, options);

        return data;
    }

    return this.ready();
});
