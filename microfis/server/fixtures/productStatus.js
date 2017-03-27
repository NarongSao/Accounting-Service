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
                "type": "Less Or Equal One Year",
                "name" : "Standard",
                "code" : "S",
                "from" : 0,
                "to" : 30,
                "provision": 1
            },

            /* 2 */
            {
                "_id" : "002",
                "type": "Less Or Equal One Year",
                "name" : "Substandard",
                "code" : "U",
                "from" : 31,
                "to" : 90,
                "provision": 10
            },

            /* 3 */
            {
                "_id" : "003",
                "type": "Less Or Equal One Year",
                "name" : "Doubtful",
                "code" : "D",
                "from" : 91,
                "to" : 180,
                "provision": 30
            },

            /* 4 */
            {
                "_id" : "004",
                "type": "Less Or Equal One Year",
                "name" : "Loss",
                "code" : "W",
                "from" : 181,
                "to" : 200000,
                "provision": 100
            },

            /* 5 */
            {
                "_id" : "005",
                "type": "Over One Year",
                "name" : "Standard",
                "code" : "S",
                "from" : 0,
                "to" : 30,
                "provision": 1
            },

            /* 6 */
            {
                "_id" : "006",
                "type": "Over One Year",
                "name" : "Substandard",
                "code" : "U",
                "from" : 31,
                "to" : 180,
                "provision": 10
            },

            /* 7 */
            {
                "_id" : "007",
                "type": "Over One Year",
                "name" : "Doubtful",
                "code" : "D",
                "from" : 181,
                "to" : 360,
                "provision": 30
            },

            /* 8 */
            {
                "_id" : "008",
                "type": "Over One Year",
                "name" : "Loss",
                "code" : "W",
                "from" : 361,
                "to" : 200000,
                "provision": 100
            }
        ];

        _.forEach(data, (val)=> {
            ProductStatus.insert(val);
        });
    }
});