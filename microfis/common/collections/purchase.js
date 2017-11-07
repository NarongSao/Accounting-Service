import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const Purchase = new Mongo.Collection("microfis_purchase");

Purchase.schema = new SimpleSchema({
    purchaseDate: {
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
    venderId: {
        type: String,
        label: 'Vender',
        max: 250
    },
    itemName: {
        type: String,
        label: 'Name',
        max: 250
    },
    category: {
        type: String,
        label: 'Category',
        autoform: {
            type: 'select2',
            afFieldInput: {
                options: function () {
                    return SelectOpts.category();
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
                    return SelectOpts.group();
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
        label: 'Name'
    },
    status: {
        type: String,
        label: 'Status',
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