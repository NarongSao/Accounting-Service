import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {SelectOpts} from '../../../imports/libs/select-opts.js';
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../../methods/select-opts.js';

export const LoanHistorySchema = new SimpleSchema({

    branchId: {
        type: [String],
        label: "Branch",
        autoform: {
            type: "select2",
            multiple: true,
            defaultValue: function () {
                return [Session.get("currentBranch")];
            },
            options: function () {
                return SelectOptsReport.branch();
            }
        }
    },
    clientId: {
        type: String,
        label: "Client",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.client();
            }
        }
    },
    date: {
        type: Date,
        label: "Date As",
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    showTodayButton: true
                }
            }
        }

    },
    coType:{
        type: String,
        label: "CO Type",
        defaultValue: "All",
        autoform: {
            type: "select2",
            options: function () {
                let coType=[];
                coType.push(
                    {label: "Only",value: "Only"},
                    {label: "Transfer",value: "Transfer"},
                    {label: "All",value: "All"}
                )
                return coType;
            }
        }
    }
});
