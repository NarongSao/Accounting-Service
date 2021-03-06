import {Meteor} from 'meteor/meteor';

import {Setting} from '../../common/collections/setting.js';

Meteor.startup(function () {
    if (Setting.find().count() == 0) {
        const data = {
            dayOfWeekToEscape: [6, 7], // Sat & Sun
            dayOfRates: {weekly: 7, monthly: 30, yearly: 365},
            writeOffDay: 30
        };

        Setting.insert(data);
    }
});