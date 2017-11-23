import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Category = new Mongo.Collection("microfis_category");

Category.schema = new SimpleSchema({
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
    branchId: {
        type: String
    }
});

Category.attachSchema(Category.schema);