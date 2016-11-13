import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {Fund} from '../../common/collections/fund.js';

Meteor.startup(function () {
    if (Fund.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "001",
                "name": "Rabbit Technolgy",
                "shortName": "RT",
                "registerDate": moment().toDate(),
                "address": "Battabmang Province",
                "telephone": "053 50 66 777",
                "email": "rabbittechnology@gmail.com",
                "website": "www.rabbitits.com"
            },
            /* 2 */
            {
                "_id": "002",
                "name": "Meteor Company",
                "shortName": "MC",
                "registerDate": moment().toDate(),
                "address": "United State",
                "telephone": "0123456789",
                "email": "info@meteor.com",
                "website": "www.meteor.com"
            }
        ];

        _.forEach(data, (val)=> {
            Fund.insert(val);
        });
    }
});