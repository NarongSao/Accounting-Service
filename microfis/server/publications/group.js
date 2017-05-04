import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';


// Collection
import {Group} from '../../common/collections/group';

Meteor.publish('microfis.group', function group(selector = {}, options = {}) {
    if (this.userId) {
        let data = Group.find(selector, options);
        return data;
    }

    return this.ready();
});
