import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {__} from '../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../imports/libs/select-opts.js';
import {lookupValue} from '../../imports/libs/lookup-value.js';
import {SelectOptMethods} from '../methods/select-opts.js';

export const Location = new Mongo.Collection("microfis_location");

Location.schema = new SimpleSchema({
    type: {
        type: String,
        label: 'Type',
        defaultValue: 'P',
        autoform: {
            type: "select-radio-inline",
            options: function () {
                return lookupValue('Location Type', {selectOne: false});
            }
        }
    },
    parent: {
        type: String,
        label: function () {
            return Spacebars.SafeString('Parent <span class="text-red">*</span>');
        },
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'microfis.selectOpts.location',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let typeVal;
                        let type = AutoForm.getFieldValue('type');

                        switch (type) {
                            case 'D':
                                typeVal = 'P';
                                break;
                            case 'C':
                                typeVal = 'D';
                                break;
                            case 'V':
                                typeVal = 'C';
                                break;
                        }

                        return {type: typeVal};
                    }
                }
            }
        },
        custom: function () {
            if (this.field('type').value != 'P' && !this.value) {
                return 'required';
            }
        }
    },
    code: {
        type: String,
        label: 'Code',
        min: 2,
        max: 8,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: {
                mask: "99"
            }
        },
    },
    name: {
        type: String,
        label: 'Name',
        autoform: {
            type: "textarea"
        }
    },
    khName: {
        type: String,
        label: "KH Name",
        autoform: {
            type: "textarea"
        }
    },
    ancestors: {
        type: [String],
        optional: true
    },
});

Location.attachSchema(Location.schema);
