import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {LookupValue} from '../../common/collections/lookup-value.js';

Meteor.startup(function () {
    if (LookupValue.find().count() == 0) {
        const data = [
            // Location Type
            {
                name: 'Location Type',
                private: true,
                options: [
                    {label: 'Province', value: 'P', order: 0},
                    {label: 'District', value: 'D', order: 1},
                    {label: 'Commune', value: 'C', order: 2},
                    {label: 'Village', value: 'V', order: 3}
                ]
            },
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
                    {label: 'None', value: 'none', order: 0},
                    {label: 'Not Good', value: 'notGood', order: 1},
                    {label: 'Good', value: 'good', order: 2},
                    {label: 'Very Good', value: 'veryGood', order: 3},
                ]
            },
            // Purpose
            {
                name: 'Purpose',
                private: true,
                options: [
                    {label: 'Agriculture', value: 'Agriculture', order: 0},
                    {label: 'Business', value: 'Business', order: 1},
                    {label: 'Service', value: 'Service', order: 2},
                    {label: 'Construction', value: 'Construction', order: 3},
                    {label: 'Family', value: 'Family', order: 4},
                    {label: 'Other', value: 'Other', order: 5},
                ]
            },
            // Purpose Activity
            {
                name: 'Purpose Activity',
                private: true,
                options: [
                    {label: 'Buying', value: 'buying', order: 0},
                    {label: 'New', value: 'new', order: 1},
                    {label: 'Expand', value: 'expand', order: 2},
                ]
            },
            // Collateral Type
            {
                name: 'Collateral Type',
                private: true,
                options: [
                    {label: 'None', value: 'none', order: 0},
                    {label: 'Land Title', value: 'landtitle', order: 1},
                    {label: 'Ownership Land title/Building', value: 'owner', order: 2},
                    {label: 'Motor Vehicle', value: 'motor', order: 3},
                    {label: 'Inventory', value: 'inventory', order: 4},
                    {label: 'Other', value: 'other', order: 5},
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
                    {label: 'Business', value: 'Business', order: 2},
                    {label: 'Service', value: 'Service', order: 3},
                    {label: 'Construction', value: 'Construction', order: 4},
                    {label: 'Family', value: 'Family', order: 5},
                    {label: 'Other', value: 'Other', order: 6},
                ]
            },
            // Poverty Level
            {
                name: 'Poverty Level',
                private: true,
                options: [
                    {label: 'Poor', value: 'poor', order: 0},
                    {label: 'Average', value: 'Average', order: 1},
                    {label: 'Rich', value: 'rich', order: 2},
                ]
            },
        ];

        _.forEach(data, function (val) {
            LookupValue.insert(val);
        });
    }
});