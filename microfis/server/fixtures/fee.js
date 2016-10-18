import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Fee} from '../../common/collections/fee.js';

Meteor.startup(function () {
    if (Fee.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "001",
                "name": "Fee 1%",
                "calculateType": "P",
                "amount": 1
            },
            /* 2 */
            {
                "_id": "002",
                "name": "Fee 4$",
                "calculateType": "A",
                "amount": 5
            }
        ];

        _.forEach(data, (val)=> {
            Fee.insert(val);
        });
    }
});