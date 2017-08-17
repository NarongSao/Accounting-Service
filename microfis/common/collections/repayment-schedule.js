import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Lib
import {SelectOpts} from '../../imports/libs/select-opts.js';

export const RepaymentSchedule = new Mongo.Collection("microfis_repaymentSchedule");

RepaymentSchedule.repaidDocSchema = new SimpleSchema({
    sumPrincipal: {
        type: Number,
        decimal: true
    },
    sumInterest: {
        type: Number,
        decimal: true
    },
    sumFeeOnPayment: {
        type: Number,
        decimal: true
    },
    status: {
        type: String // inactive, partial, close
    },
    detail: {
        type: [Object]
    },
    'detail.$.repaidDate': {
        type: Date
    },
    'detail.$.principal': {
        type: Number,
        decimal: true
    },
    'detail.$.interest': {
        type: Number,
        decimal: true
    },
    'detail.$.feeOnPayment': {
        type: Number,
        decimal: true
    },
    // 'detail.$.penalty': {
    //     type: Number,
    //     decimal: true
    // },
    'detail.$.balancePrincipal': {
        type: Number,
        decimal: true
    },
    'detail.$.balanceInterest': {
        type: Number,
        decimal: true
    }
    , 'detail.$.balanceFeeOnPayment': {
        type: Number,
        decimal: true
    },
    'detail.$.status': {
        type: String
    },
    'detail.$.repaymentId': {
        type: String
    },
    'detail.$.endId': {
        type: String,
        optional: true
    },
    branchId: {
        type: String
    }
});

RepaymentSchedule.schema = new SimpleSchema({
    scheduleDate: {
        type: Date
    },
    installment: {
        type: Number
    },
    allowClosing: {
        type: Boolean
    },
    dueDate: {
        type: Date
    },
    numOfDay: {
        type: Number
    },
    principalDue: {
        type: Number,
        decimal: true
    },
    interestDue: {
        type: Number,
        decimal: true
    },
    feeOnPaymentDue: {
        type: Number,
        decimal: true
    },
    totalDue: {
        type: Number,
        decimal: true
    },
    balance: {
        type: Number,
        decimal: true
    },
    loanAccId: {
        type: String
    },
    repaymentDoc: {
        type: Object,
        optional: true,
        blackbox: true
    },
    repaymentDocRealTime: {
        type: Object,
        optional: true,
        blackbox: true
    },
    isPay: {
        type: Boolean,
        defaultValue: false
    },
    isFullPay: {
        type: Boolean,
        defaultValue: false
    },
    isPrePay: {
        type: Boolean,
        defaultValue: false
    },
    savingAccId: {
        type: String
    },
    branchId: {
        type: String,
        label: "Branch",
        optional: true
    }
});

RepaymentSchedule.attachSchema(RepaymentSchedule.schema);
