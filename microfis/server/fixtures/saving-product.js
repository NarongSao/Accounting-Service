import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {SavingProduct} from '../../common/collections/saving-product.js';

Meteor.startup(function () {
    if (SavingProduct.find().count() == 0) {
        let data = [
            {
                "_id": "001",
                "accountClass": "E",
                "accountType": [
                    "S"
                ],
                "currencyId": [
                    "KHR",
                    "USD"
                ],
                "daysInMethod": 365,
                "des": "Welcome to saving loan",
                "exchange": {
                    "USD": 1,
                    "KHR": 4000,
                    "THB": 35
                },
                "interestMethod": "Y",
                "interestRate": {
                    "min": 0,
                    "max": 12
                },
                "interestTax": 0,
                "minOpeningAmount": 0,
                "name": "Saving Loan",
                "penaltyForTermClosing": 0,
                "shortName": "SL",
                "term": 0
            }
        ];

        _.forEach(data, (val) => {
            SavingProduct.insert(val);
        });
    }
});