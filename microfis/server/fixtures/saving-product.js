import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {SavingProduct} from '../../imports/api/collections/saving-product.js';

Meteor.startup(function () {
    if (SavingProduct.find().count() == 0) {
        let data = [
            {
                "_id": "001",
                "name": "Saving Loan",
                "shortName": "SL",
                "des": 'Welcome to saving loan',
                "accountType": [
                    "S",
                    "J"
                ],
                // "operationType": [
                //     "Any",
                //     "Tow",
                //     "All"
                // ],
                "currencyId": [
                    "KHR",
                    "USD",
                    "THB"
                ],
                "minOpeningAmount": 10,
                "exchange": {
                    "USD": 1,
                    "KHR": 4000,
                    "THB": 35
                },
                "accountClass": "E",
                "term": 0,
                "penaltyForTermClosing": 0,
                "interestTax": 4,
                "interestMethod": "Y",
                "daysInMethod": 365,
                "interestRate": {
                    "min": 7,
                    "max": 12
                },
            },
            /* 1 */
        ];

        _.forEach(data, (val)=> {
            SavingProduct.insert(val);
        });
    }
});