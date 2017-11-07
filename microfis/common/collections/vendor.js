import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Vendor = new Mongo.Collection("microfis_vendor");

Vendor.schema = new SimpleSchema({

    name: {
        type: String,
        label: 'Name',
        max: 250
    },
    description: {
        type: String,
        label: 'Description',
        max: 250
    },
    address: {
        type: String,
        label: 'Address',
        max: 250
    },
    email: {
        type: String,
        label: 'Email',
        max: 250
    },
    tel: {
        type: String,
        label: 'Tel',
        max: 250
    }
});