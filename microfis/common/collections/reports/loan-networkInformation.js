import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {SelectOpts} from '../../../imports/libs/select-opts.js';
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../../methods/select-opts.js';

export const LoanNetworkInformationSchema = new SimpleSchema({
    creditOfficerId: {
        type: [String],
        label: 'Credit Officer',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.creditOfficer();
            }
        }
    },
    exchangeId: {
        type: String,
        label: 'Exchange Date',
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.exchangeNBC();
            }
        }
    },
    currencyId: {
        type: [String],
        label: 'Currency',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.currency();
            }
        }
    },
    productId: {
        type: [String],
        label: 'Product',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.product();
            }
        }
    },
    locationId: {
        type: [String],
        label: 'Location',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true
        }
    },
    fundId: {
        type: [String],
        label: 'Fund',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.fund();
            }
        }
    },
    classifyId: {
        type: [String],
        label: 'Classify',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.classify();
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
    repaidFrequency: {
        type: Number,
        label: 'Repay Frequency',
        defaultValue: 0,
        autoform: {
            type: "select2",
            options: function () {
                let repayFrequency = [{label: "All", value: 0}];
                let i = 1;
                for (i; i < 100; i++) {
                    repayFrequency.push({label: i.toString(), value: i})
                }
                return repayFrequency;
            }
        }
    }
});
