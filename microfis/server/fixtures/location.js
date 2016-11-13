import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Location} from '../../common/collections/location.js';

Meteor.startup(function () {
    if (Location.find().count() == 0) {
        let data = [];

        _.forEach(data, (val)=> {
            Location.insert(val);
        });
    }
});