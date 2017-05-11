import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {PenaltyClosing} from '../../common/collections/penalty-closing.js';

Meteor.startup(function () {
    /*if (PenaltyClosing.find().count() == 0) {
        let data = [
            /!* 1 *!/
            {
                "_id": "001",
                "name": "Penalty Closing 20%",
                "installmentType": "P",
                "installmentTermLessThan": 50,
                "calculateType": "P",
                "penaltyRemainderTypeOf": "Loan Outstanding",
                "interestRemainderCharge": 20
            }
        ];

        _.forEach(data, (val)=> {
            PenaltyClosing.insert(val);
        });
    }*/
});