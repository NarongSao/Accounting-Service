import {Meteor} from 'meteor/meteor';

import {Setting} from '../../imports/api/collections/setting.js';

Meteor.startup(function () {
    if (Setting.find().count() == 0) {
        const data = {
            dayOfWeekToEscape: [6, 7], // Sat & Sun
            dayOfRates: {weekly: 7, monthly: 30, yearly: 365}
        };

        Setting.insert(data);
    }
});