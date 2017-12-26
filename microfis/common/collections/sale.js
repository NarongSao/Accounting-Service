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
            placeholder: "Price",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    priceInKH: {
        type: String,
        optional:true,
        label: "Price In Khmer"
    },
    paid: {
        type: Number,
        label: 'Paid',
        decimal: true,
        autoform: {
            type: 'inputmask',
            placeholder: "Paid",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    paidInKH: {
        type: String,
        optional:true,
        label: "Paid In Khmer"
    },
    remaining: {
        type: Number,
        decimal: true,
        label: 'Remain',
        defaultValue: 0,
        autoform: {
            type: 'inputmask',
            placeholder: "Price",
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    remainingInKH: {
        type: String,
        optional:true,
        label: "Remaining In Khmer"
    },
    branchId: {
        type: String
    },
    loanAccId:{
        type: String,
        optional:true
    },
    description:{
        type: String,
        autoform: {
        afFieldInput: {
            type: 'summernote',
            class: 'editor',
            settings:{
                height:320
            }
        }
    }
    }
});

Sale.attachSchema(Sale.schema);


