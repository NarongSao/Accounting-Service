import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Sale = new Mongo.Collection("microfis_sale");

Sale.schema = new SimpleSchema({
    saleDate: {
        type: Date,
        label: 'Sale Date',
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
    transactionType: {
        type: String,
        label: 'Transaction Type',
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                    return SelectOpts.transactionType();
                }
            }
        }
    },
    customerId: {
        type: String,
        label: 'Customer',
        max: 250
    },
    purchaseId: {
        type: String,
        label: 'Purchase Id',
        max: 250
    },
    price: {
        type: Number,
        decimal: true,
        label: 'Price',
    },
    paid: {

        type: Number,
        decimal: true,
        label: 'Paid'
    },
    remaining: {
        type: Number,
        decimal: true,
        label: 'Remain'
    },
    branchId: {
        type: String
    }
});

