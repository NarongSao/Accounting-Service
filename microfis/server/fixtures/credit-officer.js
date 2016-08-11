import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {CreditOfficer} from '../../imports/api/collections/credit-officer.js';

Meteor.startup(function () {
    if (CreditOfficer.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "001-0001",
                "khName": "ហេង យូសួរ",
                "enName": "Heng Yousour",
                "gender": "M",
                "dob": moment("2001-01-18").toDate(),
                "address": "Battambang Province",
                // "telephone": "",
                // "photo": "",
                "branchId": "001"
            },
            /* 2 */
            {
                "_id": "001-0002",
                "khName": "កៅ វាសនា",
                "enName": "Kao Veasna",
                "gender": "M",
                "dob": moment("2001-01-18").toDate(),
                "address": "Battambang Province",
                // "telephone": "",
                // "photo": "",
                "branchId": "001"
            }
        ];

        _.forEach(data, (val)=> {
            CreditOfficer.insert(val);
        });
    }
});