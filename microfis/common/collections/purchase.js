import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Purchase = new Mongo.Collection("microfis_purchase");

Purchase.schema = new SimpleSchema({
    purchaseDate: {
        type: Date,
        label: 'Purchase Date',
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
            defaultValue: "cash",
            afFieldInput: {
                options: function () {
                    // return SelectOpts.transactionType();
                    let list=[];
                    list.push({label:"Credit", value:"credit"});
                    list.push({label:"Cash", value:"cash"});
                    return list;
                }
            }
        }
    },
    vendorId: {
        type: String,
        label: 'Vendor',
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                    return SelectOpts.vendorOption();
                }
            }
        }
    },
    itemName: {
        type: String,
        label: 'Item Name',
        max: 250
    },
    category: {
        type: String,
        label: 'Category',
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                    return SelectOpts.categoryOption();
                }
            }
        }
    },
    group: {
        type: String,
        label: 'Group',
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                     return SelectOpts.groupCategory();
                }
            }
        }
    },
    cost: {
        type: Number,
        decimal: true,
        label: 'Cost'
    },
    price: {
        type: Number,
        decimal: true,
        label: 'Price'
    },
    status: {
        type: Boolean,
        label: 'Status',
        defaultValue:false,
        max: 250
    },
    closedDate: {
        type: Date,
        label: 'Close Date',
        optional: true
    },
    branchId: {
        type: String
    }
});
Purchase.attachSchema(Purchase.schema);
