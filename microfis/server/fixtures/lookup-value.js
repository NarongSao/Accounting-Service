import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {LookupValue} from '../../imports/api/collections/lookup-value.js';

Meteor.startup(function () {
    if (LookupValue.find().count() == 0) {
        const data = [
            // Prefix
            {
                name: 'Prefix',
                private: true,
                options: [
                    {label: 'Mr', value: 'Mr', order: 0},
                    {label: 'Miss', value: 'Miss', order: 1},
                    {label: 'Ms', value: 'Ms', order: 2},
                    {label: 'Mrs', value: 'Mrs', order: 3}
                ]
            },
            // History
            {
                name: 'History',
                private: true,
                options: [
                    {label: 'History0', value: 'History0', order: 0},
                    {label: 'History1', value: 'History1', order: 1},
                    {label: 'History2', value: 'History2', order: 2},
                ]
            },
            // Purpose
            {
                name: 'Purpose',
                private: true,
                options: [
                    {label: 'Purpose0', value: 'Purpose0', order: 0},
                    {label: 'Purpose1', value: 'Purpose1', order: 1},
                    {label: 'Purpose2', value: 'Purpose2', order: 2},
                ]
            },
            // Purpose Activity
            {
                name: 'Purpose Activity',
                private: true,
                options: [
                    {label: 'Activity0', value: 'Activity0', order: 0},
                    {label: 'Activity1', value: 'Activity1', order: 1},
                    {label: 'Activity2', value: 'Activity2', order: 2},
                ]
            },
            // Collateral Type
            {
                name: 'Collateral Type',
                private: true,
                options: [
                    {label: 'Type0', value: 'Type0', order: 0},
                    {label: 'Type1', value: 'Type1', order: 1},
                    {label: 'Type2', value: 'Type2', order: 2},
                ]
            },
            // Collateral Security
            {
                name: 'Collateral Security',
                private: true,
                options: [
                    {label: 'Poor', value: 'POO', order: 0},
                    {label: 'Average', value: 'AVG', order: 1},
                    {label: 'Good', value: 'GD', order: 2},
                    {label: 'Very Good', value: 'VG', order: 3},
                ]
            },
            // Education
            {
                name: 'Education',
                private: true,
                options: [
                    {label: 'Primary School', value: 'PS', order: 0},
                    {label: 'Secondary School', value: 'SS', order: 1},
                    {label: 'High School', value: 'HS', order: 2},
                    {label: 'University', value: 'UN', order: 3},
                ]
            },
            // Occupation
            {
                name: 'Occupation',
                private: true,
                options: [
                    {label: 'Student', value: 'ST', order: 0},
                    {label: 'Agriculture', value: 'AG', order: 1},
                ]
            },
            // Poverty Level
            {
                name: 'Poverty Level',
                private: true,
                options: [
                    {label: 'Level 0', value: 'L0', order: 0},
                    {label: 'Level 1', value: 'L1', order: 1},
                ]
            },
        ];

        _.forEach(data, function (val) {
            LookupValue.insert(val);
        });
    }
});