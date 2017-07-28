import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';


// Collection
import {ChangeCO} from '../../common/collections/changeCO';

Meteor.publish('microfis.changeCO', function changeCO(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = ChangeCO.find(selector, options);

        return data;
    }

    return this.ready();
});
