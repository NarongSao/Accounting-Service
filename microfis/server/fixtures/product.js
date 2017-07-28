import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Product} from '../../common/collections/product.js';

Meteor.startup(function () {
    /*if (Product.find().count() == 0) {
        let data = [
            /!* 1 *!/
            {
                "_id": "001",
                "name": "General",
                "shortName": "G",
                "startDate": moment("2016-01-01").toDate(),
                "endDate": moment("2017-12-31").toDate(),
                "accountType": [
                    "IL",
                    "GL"
                ],
                "currencyId": [
                    "KHR",
                    "USD",
                    "THB"
                ],
                "exchange": {
                    "USD": 1,
                    "KHR": 4000,
                    "THB": 35
                },
                "loanAmount": {
                    "min": 100,
                    "max": 2000
                },
                "paymentMethod": "M",
                "term": {
                    "min": 1,
                    "max": 24
                },
                "interestMethod": "Declining",
                "interestRate": {
                    "min": 2,
                    "defaultRate": 2.5,
                    "max": 3
                },
                "feeId": ["001"],
                "feeOnPaymentId": ["001"],
                "penaltyId": "001",
                "penaltyClosingId": "001"
            }
        ];

        _.forEach(data, (val) => {
            Product.insert(val);
        });
    }*/
});