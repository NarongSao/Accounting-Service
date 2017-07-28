import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Holiday = new Mongo.Collection("microfis_holiday");

Holiday.schema = new SimpleSchema({
    from: {
        type: Date,
        label: 'From',
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }
    },
    to: {
        type: Date,
        label: 'To',
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: 'bootstrap-datetimepicker',
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        },
        custom: function () {
            let from = moment(this.field('from').value);
            let to = moment(this.value);

            if (from.isAfter(to)) {
                return 'cusMinDate';
            }
        }
    },
    name: {
        type: String,
        label: 'Name',
        max: 250
    }
});

Holiday.attachSchema(Holiday.schema);

SimpleSchema.messages({
    cusMinDate: '[label] must be on or after [From]'
});
