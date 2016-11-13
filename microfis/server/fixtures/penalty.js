import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Penalty} from '../../common/collections/penalty.js';

Meteor.startup(function () {
    if (Penalty.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "001",
                "name": "Penalty 1%",
                "calculateType": "P",
                "amount": 1,
                "graceDay": 3
            },
            /* 2 */
            {
                "_id": "002",
                "name": "Penalty 1$",
                "calculateType": "A",
                "amount": 1,
                "graceDay": 3
            }
        ];

        _.forEach(data, (val)=> {
            Penalty.insert(val);
        });
    }
});