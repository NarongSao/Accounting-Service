import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Location = new Mongo.Collection('microfis_location');

Location.schema = new SimpleSchema({
    khName: {
        type: String,
        label: 'Kh name',
        max: 250,
        custom: function () {
            if (Meteor.isServer && this.isSet) {
                let parentId = this.field('parentId').value;
                let selector = {khName: this.value, parentId: parentId};

                // Check for updating
                if (this.isUpdate) {
                    selector._id = {$ne: this.docId};
                }
                return locationIsExists(Location, selector);
            }
        }
    },
    enName: {
        type: String,
        label: 'En name',
        max: 250,
        custom: function () {
            if (Meteor.isServer && this.isSet) {
                let parentId = this.field('parentId').value;
                let selector = {enName: this.value, parentId: parentId};

                // Check for updating
                if (this.isUpdate) {
                    selector._id = {$ne: this.docId};
                }
                return locationIsExists(Location, selector);
            }
        }
    },
    level: {
        type: Number,
        label: 'Level',
        defaultValue: function () {
            let parentId = AutoForm.getFieldValue('parentId');
            let length = parentId ? parentId.length : 0;
            let level = (length + 2) / 2;

            return level;
        }
    },
    parentId: {
        type: String,
        label: 'Parent id',
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                removeButton: true,
                optionsMethod: 'microfis.selectOpts.location'
            }
        }
    },
    parentDoc: {
        type: Object,
        label: 'Parent doc',
        optional: true,
        blackbox: true
    }
});

Location.attachSchema(Location.schema);

// Check name exists
SimpleSchema.messages({
    locationIsExists: '[label] is exists'
});

if (Meteor.isServer) {
    var locationIsExists = function (Collection, selector) {
        var existsCount = Collection.find(selector).count();

        if (existsCount > 0) {
            return 'notUnique';
        }
    };
}
