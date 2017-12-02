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
            defaultValue: "credit",
            afFieldInput: {
                options: function () {
                    let list=[];
                    list.push({label:"Credit", value:"credit"});
                    list.push({label:"Cash", value:"cash"});
                    return list;
                }
            }
        }
    },
    customerId: {
        type: String,
        label: 'Customer'
    },
    purchaseId: {
        type: String,
        label: 'Item'
    },
    price: {
        type: Number,
        label: 'Price' ,
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Debit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    paid: {
        type: Number,
        label: 'Paid',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Debit",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    remaining: {
        type: Number,
        decimal: true,
        label: 'Remain',
        defaultValue: 0
    },
    branchId: {
        type: String
    },
    loanAccid:{
        type: String,
        optional:true
    }
});

Sale.attachSchema(Sale.schema);


