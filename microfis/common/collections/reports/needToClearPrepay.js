import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {SelectOpts} from '../../../imports/libs/select-opts.js';
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../../methods/select-opts.js';

export const NeedToClearPrepaymentSchema = new SimpleSchema({
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
                )
                return coType;
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
    customField: {
        type: [String],
        label: "Custom Field",
        optional: true,
        /* autoform: {
         type: "select2",
         multiple: true,
         options: function () {
         let customFieldList = [];

         customFieldList = [
         {label: "No", value: "No"},
         {label: "Voucher Code", value: "Voucher Code"},
         {label: "LA Code", value: "LA Code"},
         {label: "Client Name", value: "Client Name"},
         {label: "Product Name", value: "Product Name"},
         {label: "CRC", value: "CRC"},
         {label: "Type", value: "Type"},
         {label: "Dis Date", value: "Dis Date"},
         {label: "Mat Date", value: "Mat Date"},
         {label: "Loan Amount", value: "Loan Amount"},
         {label: "Pro Int", value: "Pro Int"},
         {label: "Pro Operation Fee", value: "Pro Operation Fee"},
         {label: "Col Date", value: "Col Date"},
         {label: "Clear Date", value: "Clear Date"},
         {label: "Col Prin", value: "Col Prin"},
         {label: "Col Int", value: "Col Int"},
         {label: "Col Operation Fee", value: "Col Operation Fee"},
         {label: "Total Col", value: "Total Col"},
         {label: "Col Pen", value: "Col Pen"}
         ]

         return customFieldList;
         }
         }*/
    },
    accountType:{
        type: String,
        label: "Account Type",
        defaultValue: "All",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.accountTypeReport();
            }
        }
    }
});
