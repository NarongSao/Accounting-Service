import {Meteor} from 'meteor/meteor';

import {LookupValue} from '../../imports/api/collections/lookup-value.js';

Meteor.startup(function () {
    if (LookupValue.find().count() == 0) {
        const data = [
            // Prefix
            {
                name: 'Prefix',
                private: true,
                options: [
                    {label: 'Mr', value: 'Mr', index: 1},
                    {label: 'Miss', value: 'Miss', index: 2},
                    {label: 'Ms', value: 'Ms', index: 3},
                    {label: 'Mrs', value: 'Mrs', index: 4}
                ]
            },
            // History
            {
                name: 'History',
                private: true,
                options: [
                    {label: 'History1', value: 'History1', index: 1},
                    {label: 'History2', value: 'History2', index: 2},
                    {label: 'History3', value: 'History3', index: 3},
                ]
            },
            // Purpose
            {
                name: 'Purpose',
                private: true,
                options: [
                    {label: 'Purpose1', value: 'Purpose1', index: 1},
                    {label: 'Purpose2', value: 'Purpose2', index: 2},
                    {label: 'Purpose3', value: 'Purpose3', index: 3},
                ]
            },
            // Purpose Activity
            {
                name: 'Purpose Activity',
                private: true,
                options: [
                    {label: 'Activity1', value: 'Activity1', index: 1},
                    {label: 'Activity2', value: 'Activity2', index: 2},
                    {label: 'Activity3', value: 'Activity3', index: 3},
                ]
            },
            // Collateral Type
            {
                name: 'Collateral Type',
                private: true,
                options: [
                    {label: 'Type1', value: 'Type1', index: 1},
                    {label: 'Type2', value: 'Type2', index: 2},
                    {label: 'Type3', value: 'Type3', index: 3},
                ]
            },
            // Collateral Security
            {
                name: 'Collateral Security',
                private: true,
                options: [
                    {label: 'Poor', value: 'POO', index: 1},
                    {label: 'Average', value: 'AVG', index: 2},
                    {label: 'Good', value: 'GD', index: 3},
                    {label: 'Very Good', value: 'VG', index: 4},
                ]
            },
            // Education
            {
                name: 'Education',
                private: true,
                options: [
                    {label: 'Primary School', value: 'PS', index: 1},
                    {label: 'Secondary School', value: 'SS', index: 2},
                    {label: 'High School', value: 'HS', index: 3},
                    {label: 'University', value: 'UN', index: 4},
                ]
            },
            // Occupation
            {
                name: 'Occupation',
                private: true,
                options: [
                    {label: 'Student', value: 'ST', index: 1},
                    {label: 'Agriculture', value: 'AG', index: 2},
                ]
            },
            // Poverty Level
            {
                name: 'Poverty Level',
                private: true,
                options: [
                    {label: 'Level 1', value: 'L1', index: 1},
                    {label: 'Level 2', value: 'L2', index: 2},
                ]
            },
        ];

        data.forEach(function (obj) {
            LookupValue.insert(obj);
        });
    }
});