import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {FlowRouterTitle} from 'meteor/ostrio:flow-router-title';
import 'meteor/arillo:flow-router-helpers';
import 'meteor/zimme:active-route';
import 'meteor/theara:flow-router-breadcrumb';

// Lib
import {__} from '../../core/common/libs/tapi18n-callback-helper.js';

// Layout
import {Layout} from '../../core/client/libs/render-layout.js';
import '../../core/imports/layouts/report/index.html';

// Group
let MicrofisRoutes = FlowRouter.group({
    prefix: '/microfis',
    title: "Microfis",
    titlePrefix: 'Microfis > ',
    subscriptions: function (params, queryParams) {
//     this.register('files', Meteor.subscribe('files'));
    }
});

// Repayment schedule
import '../imports/reports/repayment-schedule.js';
MicrofisRoutes.route('/repayment-schedule-report', {
    name: 'microfis.repaymentScheduleReport',
    title: 'Repayment Schedule Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentScheduleReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Repayment Schedule Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Repayment schedule Form1
import '../imports/reports/repayment-schedule-form1';
MicrofisRoutes.route('/repayment-schedule-form1-report', {
    name: 'microfis.repaymentScheduleForm1Report',
    title: 'Repayment Schedule Report Form 1',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentScheduleForm1Report');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Repayment Schedule Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// Repayment schedule summary
import '../imports/reports/repayment-schedule-summary.js';
MicrofisRoutes.route('/repayment-schedule-summary-report', {
    name: 'microfis.repaymentScheduleSummaryReport',
    title: 'Repayment Schedule Summary Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentScheduleSummaryReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Repayment Schedule Summary Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// loan outstanding
import '../imports/reports/loan-outstanding.js';
MicrofisRoutes.route('/loan-outstanding-report', {
    name: 'microfis.loanOutstandingReport',
    title: 'Loan Outstanding Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanOutstandingReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Outstanding Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// Collection Sheet
import '../imports/reports/collectionSheet.js';
MicrofisRoutes.route('/collectionSheet-report', {
    name: 'microfis.collectionSheetReport',
    title: 'Collection Sheet Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_collectionSheetReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Collection Sheet Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// Collection Sheet Group
import '../imports/reports/collectionSheetGroup';
MicrofisRoutes.route('/collectionSheetGroup-report', {
    name: 'microfis.collectionSheetGroupReport',
    title: 'Collection Sheet Group Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_collectionSheetGroupReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Collection Sheet Group Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});


// Write Off
import '../imports/reports/loan-writeOff';
MicrofisRoutes.route('/writeOff-report', {
    name: 'microfis.writeOffReport',
    title: 'Write Off Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_writeOffReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Write Off Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Write Off Ending
import '../imports/reports/loan-writeOffEnding';
MicrofisRoutes.route('/writeOffEnding-report', {
    name: 'microfis.writeOffEndingReport',
    title: 'Write Off Ending Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_writeOffEndingReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Write Off Ending Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// waived
import '../imports/reports/loan-waived';
MicrofisRoutes.route('/waived-report', {
    name: 'microfis.waivedReport',
    title: 'Waived Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_waivedReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Write Off Ending Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Client Balance
import '../imports/reports/loan-clientBalance';
MicrofisRoutes.route('/clientBalance-report', {
    name: 'microfis.clientBalanceReport',
    title: 'Client Balance Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_clientBalanceReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Client Balance Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan Closing
import '../imports/reports/loanClosing.js';
MicrofisRoutes.route('/loanClosing-report', {
    name: 'microfis.loanClosingReport',
    title: 'Loan Closing Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanClosingReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Closing Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan Disbursment
import '../imports/reports/loan-disbursment.js';
MicrofisRoutes.route('/loanDisbursment-report', {
    name: 'microfis.loanDisbursmentReport',
    title: 'Loan Disbursment Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanDisbursmentReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Disbursment Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan History
import '../imports/reports/loanHistory.js';
MicrofisRoutes.route('/loanHistory-report', {
    name: 'microfis.loanHistoryReport',
    title: 'Loan History Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanHistoryReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan History Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan Arrear
import '../imports/reports/loan-arrears.js';
MicrofisRoutes.route('/loanArrears-report', {
    name: 'microfis.loanArrearsReport',
    title: 'Loan Arrears Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanArrearsReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Arrears Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// Loan Repayment
import '../imports/reports/loan-repayment';
MicrofisRoutes.route('/loanRepayment-report', {
    name: 'microfis.loanRepaymentReport',
    title: 'Loan Repayment Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanRepaymentReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Repayment Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan Repayment Fee
import '../imports/reports/loan-repaymentFee';
MicrofisRoutes.route('/loanRepaymentFee-report', {
    name: 'microfis.loanRepaymentFeeReport',
    title: 'Loan Repayment Fee Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentFeeReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Repayment Fee Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
// Loan Repayment WriteOff
import '../imports/reports/loan-repaymentWriteOff';
MicrofisRoutes.route('/loanRepaymentWriteOff-report', {
    name: 'microfis.loanRepaymentWriteOffReport',
    title: 'Loan Repayment WriteOff Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentWriteOffReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Repayment WriteOff Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Product Activity
import '../imports/reports/productActivity.js';
MicrofisRoutes.route('/productActivity-report', {
    name: 'microfis.productActivityReport',
    title: 'Product Activity Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_productActivityReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Product Activity Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan BreakDown By Currency
import '../imports/reports/loan-breakDownByCurrency';
MicrofisRoutes.route('/loanBreakDownByCurrency-report', {
    name: 'microfis.loanBreakDownByCurrencyReport',
    title: 'Loan Break Down By Currency Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanBreakDownByCurrencyReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Break Down By Currency Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan BreakDown By Purpose
import '../imports/reports/loan-breakDownByPurpose';
MicrofisRoutes.route('/loanBreakDownByPurpose-report', {
    name: 'microfis.loanBreakDownByPurposeReport',
    title: 'Loan Break Down By Purpose Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanBreakDownByPurposeReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Break Down By Purpose Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan Classification
import '../imports/reports/loan-classification';
MicrofisRoutes.route('/loanClassification-report', {
    name: 'microfis.loanClassificationReport',
    title: 'Loan Classification Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanClassificationReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Classification Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Loan NetworkInformation
import '../imports/reports/loan-networkInformation';
MicrofisRoutes.route('/loanNetworkInformation-report', {
    name: 'microfis.loanNetworkInformationReport',
    title: 'Loan Network Information Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_loanNetworkInformationReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Loan Network Information Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});

// Clear Prepayment
import '../imports/reports/clearPrepayment';
MicrofisRoutes.route('/clearPrepayment-report', {
    name: 'microfis.clearPrepaymentReport',
    title: 'Clear Prepayment Report',
    action: function (params, queryParams) {
        Layout.main('Microfis_clearPrepaymentReport');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Clear Prepayment Report',
        icon: 'fa-circle-o',
        parent: 'microfis.home'
    }
});
