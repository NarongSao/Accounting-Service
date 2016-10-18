import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Location} from '../../common/collections/location.js';

Meteor.startup(function () {
    if (Location.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "01",
                "khName": "បន្ទាយមានជ័យ",
                "enName": "Banteay Meanchey",
                "level": 1
            },

            /* 2 */
            {
                "_id": "02",
                "khName": "បាត់ដំបង",
                "enName": "Battambang",
                "level": 1
            },

            /* 3 */
            {
                "_id": "0201",
                "parentId": "02",
                "level": 2,
                "khName": "សង្កែ",
                "enName": "Sangke",
                "parentDoc": {
                    "khNamePro": "បាត់ដំបង",
                    "enNamePro": "Battambang"
                }
            },

            /* 4 */
            {
                "_id": "020101",
                "parentId": "0201",
                "level": 3,
                "khName": "អូរដំបង១",
                "enName": "Odambang 1",
                "parentDoc": {
                    "khNameDis": "សង្កែ",
                    "enNameDis": "Sangke",
                    "khNamePro": "បាត់ដំបង",
                    "enNamePro": "Battambang"
                }
            },

            /* 5 */
            {
                "_id": "02010101",
                "parentId": "020101",
                "level": 4,
                "khName": "វត្តតាមិម",
                "enName": "Wattamim",
                "parentDoc": {
                    "khNameCom": "អូរដំបង១",
                    "enNameCom": "Odambang 1",
                    "khNameDis": "សង្កែ",
                    "enNameDis": "Sangke",
                    "khNamePro": "បាត់ដំបង",
                    "enNamePro": "Battambang"
                }
            }
        ];

        _.forEach(data, (val)=> {
            Location.insert(val);
        });
    }
});