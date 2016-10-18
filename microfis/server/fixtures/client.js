import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {Client} from '../../common/collections/client.js';

Meteor.startup(function () {
    if (Client.find().count() == 0) {
        let data = [
            /* 1 */
            {
                "_id": "001-000001",
                "prefix": "Mr",
                "khSurname": "យួម",
                "khGivenName": "ធារ៉ា",
                "khNickname": "ធារ៉ា",
                "enSurname": "Yuom",
                "enGivenName": "Theara",
                "enNickname": "Theara",
                "gender": "M",
                "dob": moment("1990-01-01").toDate(),
                "maritalStatus": "M",
                // "photo": "",
                "branchId": "001",
                "idType": "N",
                "idNumber": "123456789",
                "idExpiryDate": moment("2020-01-01").toDate(),
                "address": "Wattamim, Odambang 1, Sangke District, Battambang Province",
                "telephone": "070 550 880"
            }
        ];

        _.forEach(data, (val)=> {
            Client.insert(val);
        });
    }
});