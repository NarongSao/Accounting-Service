import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';


// Lib
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';

export const LoanDisbursmentSchema = new SimpleSchema({
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
    paymentMethod: {
        type: [String],
        label: 'Payment Method',
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
            options: function () {
                return SelectOptsReport.paymentMethod();
            }
        }
    },
    exchangeId: {
        type: String,
        label: 'Exchange Date',
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.exchange();
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
    cycle: {
        type: Number,
        label: 'Cycle',
        defaultValue: 0,
        autoform: {
            type: "select2",
            options: function () {
                let cycleList = [{label: "All", value: 0}];
                let i = 1;
                for (i; i < 100; i++) {
                    cycleList.push({label: i.toString(), value: i})
                }
                return cycleList;
            }
        }
    },
    repayFrequency: {
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
    },

    branchId: {
        type: [String],
        label: "Branch",
        defaultValue: ["All"],
        autoform: {
            type: "select2",
            multiple: true,
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

    },
    coType: {
        type: String,
        label: "CO Type",
        defaultValue: "All",
        autoform: {
            type: "select2",
            options: function () {
                let coType = [];
                coType.push(
                    {label: "Only", value: "Only"},
                    {label: "Transfer", value: "Transfer"},
                    {label: "All", value: "All"}
                );

                return coType;
            }
        }
    }
});
