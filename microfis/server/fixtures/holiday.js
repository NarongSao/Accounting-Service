import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';

import {Holiday} from '../../imports/api/collections/holiday.js';

Meteor.startup(function () {
    if (Holiday.find().count() == 0) {
        let data = [
            {from: moment('2016-01-01').toDate(), to: moment('2016-01-01').toDate(), name: 'New Year'},
            {from: moment('2016-01-07').toDate(), to: moment('2016-01-07').toDate(), name: '7 Jan'},
            {from: moment('2016-02-22').toDate(), to: moment('2016-02-22').toDate(), name: 'Meak Bochear'},
            {from: moment('2016-03-08').toDate(), to: moment('2016-03-08').toDate(), name: 'National Lady'},
            {from: moment('2016-04-13').toDate(), to: moment('2016-04-16').toDate(), name: 'Khmer New Year'},
            {from: moment('2016-05-01').toDate(), to: moment('2016-05-01').toDate(), name: 'National Labour'},
            {from: moment('2016-05-13').toDate(), to: moment('2016-05-15').toDate(), name: 'Kingdom Birthday'},
            {from: moment('2016-05-20').toDate(), to: moment('2016-05-20').toDate(), name: 'Visak Bochear'},
            {from: moment('2016-05-24').toDate(), to: moment('2016-05-24').toDate(), name: 'Chrot Prash Ningkol'},
            {from: moment('2016-06-01').toDate(), to: moment('2016-06-01').toDate(), name: 'National Kid'},
            {from: moment('2016-09-24').toDate(), to: moment('2016-09-24').toDate(), name: 'Roth Torminunh'},
            {from: moment('2016-09-24').toDate(), to: moment('2016-09-24').toDate(), name: 'Roth Torminunh'},
            {from: moment('2016-09-30').toDate(), to: moment('2016-10-02').toDate(), name: 'Phachom Ben'},
            {from: moment('2016-11-13').toDate(), to: moment('2016-11-15').toDate(), name: 'Water Festival Day'},
            {from: moment('2016-12-10').toDate(), to: moment('2016-12-10').toDate(), name: 'Human\'s Rights Day'},
        ];

        _.forEach(data, (value)=> {
            Holiday.insert(value);
        });
    }
});