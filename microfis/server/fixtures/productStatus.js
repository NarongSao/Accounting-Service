import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {ProductStatus} from '../../common/collections/productStatus.js';

Meteor.startup(function () {
    if (ProductStatus.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id" : "001",
                "name" : "Standard",
                "code" : "S",
                "from" : 0,
                "to" : 30
            },

            /* 2 */
            {
                "_id" : "002",
                "name" : "Substandard",
                "code" : "U",
                "from" : 31,
                "to" : 90
            },

            /* 3 */
            {
                "_id" : "003",
                "name" : "Doubtful",
                "code" : "D",
                "from" : 91,
                "to" : 180
            },

            /* 4 */
            {
                "_id" : "004",
                "name" : "Loss",
                "code" : "W",
                "from" : 181,
                "to" : 200000
            }
        ];

        _.forEach(data, (val)=> {
            ProductStatus.insert(val);
        });
    }
});