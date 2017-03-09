import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {PaymentStatus} from '../../common/collections/paymentStatus.js';

Meteor.startup(function () {
    if (PaymentStatus.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id" : "001",
                "name" : "0-Current",
                "code" : "0",
                "from" : 0,
                "to" : 30
            },

            /* 2 */
            {
                "_id" : "002",
                "name" : "1-30 days overdue",
                "code" : "1",
                "from" : 31,
                "to" : 60
            },

            /* 3 */
            {
                "_id" : "003",
                "name" : "2-60 days overdue",
                "code" : "2",
                "from" : 61,
                "to" : 90
            },

            /* 4 */
            {
                "_id" : "004",
                "name" : "3-90 days overdue",
                "code" : "3",
                "from" : 91,
                "to" : 120
            },

            /* 5 */
            {
                "_id" : "005",
                "name" : "4-120 days overdue",
                "code" : "4",
                "from" : 121,
                "to" : 150
            },

            /* 6 */
            {
                "_id" : "006",
                "name" : "5-150 days overdue",
                "code" : "5",
                "from" : 151,
                "to" : 180
            },

            /* 7 */
            {
                "_id" : "007",
                "name" : "6-180 days overdue",
                "code" : "6",
                "from" : 181,
                "to" : 210
            },

            /* 8 */
            {
                "_id" : "008",
                "name" : "7-210 days overdue",
                "code" : "7",
                "from" : 211,
                "to" : 240
            },

            /* 9 */
            {
                "_id" : "009",
                "name" : "8-240 days overdue",
                "code" : "8",
                "from" : 241,
                "to" : 270
            },

            /* 10 */
            {
                "_id" : "010",
                "name" : "9-270 days overdue",
                "code" : "9",
                "from" : 271,
                "to" : 300
            },

            /* 11 */
            {
                "_id" : "011",
                "name" : "10-300 days overdue",
                "code" : "T",
                "from" : 201,
                "to" : 330
            },
            /* 12 */
            {
                "_id" : "012",
                "name" : "11-330 days overdue",
                "code" : "E",
                "from" : 331,
                "to" : 3300
            }
        ];

        _.forEach(data, (val)=> {
            PaymentStatus.insert(val);
        });
    }
});