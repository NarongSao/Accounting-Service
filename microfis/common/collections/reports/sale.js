import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';


// Lib
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';

// import {dateRangePickerOpts} from '../../../../core/client/libs/date-range-picker-opts.js';

export const SaleSchema = new SimpleSchema({
    vendorId: {
        type: [String],
        label: 'Vendor',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.vendorReport();
            }
        }
    },
    categoryId: {
        type: [String],
        label: 'Category',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.categoryReport();
            }
        }
    },
    groupId: {
        type: [String],
        label: 'Group',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.groupReport();
            }
        }
    },
    transactionType: {
        type: [String],
        label: 'Transaction Type',
        autoform: {
            type: "select2",
            multiple: true,
            defaultValue: ["All"],
            options: function () {
                let list = [{
                    label: "(Select All)",
                    value: "All"
                }];
                list.push({label: "Credit", value: "credit"});
                list.push({label: "Cash", value: "cash"});
                return list;
            }
        }
    },

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
    date: {
        type: [Date],
        label: 'Date',
        autoform: {
            type: "bootstrap-daterangepicker",
            afFieldInput: {
                dateRangePickerOptions: function () {
                    return dateRangePickerOptions;
                }
            }
        }
    }

});
