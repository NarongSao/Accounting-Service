import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Group = new Mongo.Collection("microfis_group");

Group.schema = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        // unique: true,
        max: 250,
    },
    locationId: {
        type: String,
        label: 'Location Id',
        optional: true

    }
    ,
    locationName: {
        type: String,
        label: 'Location Name',
        optional: true
    }
    ,
    branchId: {
        type: String
    }
});


Group.attachSchema(Group.schema);
