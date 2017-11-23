import {Meteor} from 'meteor/meteor';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {FlowRouterTitle} from 'meteor/ostrio:flow-router-title';
import 'meteor/arillo:flow-router-helpers';
import 'meteor/zimme:active-route';
import 'meteor/theara:flow-router-breadcrumb';

// Lib
import {__} from '../../core/common/libs/tapi18n-callback-helper.js';

// Layout
import {Layout} from '../../core/client/libs/render-layout.js';
import '../../core/imports/layouts/login';
import '../../core/imports/layouts/main';

// Group
let MicrofisRoutes = FlowRouter.group({
    prefix: '/microfis',
    title: "Microfis",
    titlePrefix: 'Microfis > ',
    subscriptions: function (params, queryParams) {
        this.register('microfis.setting', Meteor.subscribe('microfis.setting'));
        this.register('microfis.lookupValue', Meteor.subscribe('microfis.lookupValue'));
    }
});

// Home
import '../imports/pages/home.js';
MicrofisRoutes.route('/home', {
    name: 'microfis.home',
    title: 'Home',
    action(param, queryParam){
        Layout.main('Microfis_home');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Home',
        // icon: 'home',
        parent: 'core.welcome'
    }
});

/**********************
 * Loan
 *********************/

// Lookup value
import '../imports/pages/lookup-value.js';
MicrofisRoutes.route('/lookup-value', {
    name: 'microfis.lookupValue',
    title: 'Lookup Value',
    action: function (params, queryParams) {
        Layout.main('Microfis_lookupValue');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Lookup Value',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Setting
import '../imports/pages/setting.js';
MicrofisRoutes.route('/setting', {
    name: 'microfis.setting',
    title: 'Setting',
    action: function (params, queryParams) {
        Layout.main('Microfis_setting');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Setting',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Location
import '../imports/pages/location.js';
MicrofisRoutes.route('/location', {
    name: 'microfis.location',
    title: 'Location',
    action: function (params, queryParams) {
        Layout.main('Microfis_location');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Location',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Fee
import '../imports/pages/fee.js';
MicrofisRoutes.route('/fee', {
    name: 'microfis.fee',
    title: 'Fee',
    action: function (params, queryParams) {
        Layout.main('Microfis_fee');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Fee',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Fund
import '../imports/pages/fund.js';
MicrofisRoutes.route('/fund', {
    name: 'microfis.fund',
    title: 'Fund',
    action: function (params, queryParams) {
        Layout.main('Microfis_fund');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Fund',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Holiday
import '../imports/pages/holiday.js';
MicrofisRoutes.route('/holiday', {
    name: 'microfis.holiday',
    title: 'Holiday',
    action: function (params, queryParams) {
        Layout.main('Microfis_holiday');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Holiday',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Penalty
import '../imports/pages/penalty.js';
MicrofisRoutes.route('/penalty', {
    name: 'microfis.penalty',
    title: 'Penalty',
    action: function (params, queryParams) {
        Layout.main('Microfis_penalty');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Penalty',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Penalty Closing
import '../imports/pages/penalty-closing.js';
MicrofisRoutes.route('/penalty-closing', {
    name: 'microfis.penaltyClosing',
    title: 'Penalty Closing',
    action: function (params, queryParams) {
        Layout.main('Microfis_penaltyClosing');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Penalty Closing',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Product
import '../imports/pages/product.js';
MicrofisRoutes.route('/product', {
    name: 'microfis.product',
    title: 'Product',
    action: function (params, queryParams) {
        Layout.main('Microfis_product');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Product',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Credit Officer
import '../imports/pages/credit-officer.js';
MicrofisRoutes.route('/credit-officer', {
    name: 'microfis.creditOfficer',
    title: 'Credit Officer',
    action: function (params, queryParams) {
        Layout.main('Microfis_creditOfficer');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Credit Officer',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Guarantor
import '../imports/pages/guarantor.js';
MicrofisRoutes.route('/guarantor', {
    name: 'microfis.guarantor',
    title: 'Guarantor',
    action: function (params, queryParams) {
        Layout.main('Microfis_guarantor');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Guarantor',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Client
import '../imports/pages/client.js';
MicrofisRoutes.route('/client', {
    name: 'microfis.client',
    title: 'Client',
    action: function (params, queryParams) {
        Layout.main('Microfis_client');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Client',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Client Account
import '../imports/pages/client-acc.js';
MicrofisRoutes.route('/client-acc/:clientId', {
    name: 'microfis.clientAcc',
    title: 'Account',
    subscriptions: function (params, queryParams) {
        this.register('microfis.clientById', Meteor.subscribe('microfis.clientById', params.clientId));
    },
    action: function (params, queryParams) {
        Layout.main('Microfis_clientAcc');
    },
    breadcrumb: {
        params: ['clientId'],
        //queryParams: ['show', 'color'],
        title: 'Account',
        // icon: 'sitemap',
        parent: 'microfis.client'
    }
});

// Repayment
import '../imports/pages/repayment.js';
MicrofisRoutes.route('/repayment/:clientId/:loanAccId/:savingAccId/', {
    name: 'microfis.repayment',
    title: 'Loan',
    subscriptions: function (params, queryParams) {
        this.register('microfis.loanAccById', Meteor.subscribe('microfis.loanAcc', {_id: params.loanAccId}));
        this.register('microfis.scheduleByLoanAccId', Meteor.subscribe('microfis.scheduleByLoanAccId', params.loanAccId));
    },
    action: function (params, queryParams) {
        Layout.main('Microfis_repayment');
    },
    breadcrumb: {
        params: ['clientId', 'loanAccId'],
        //queryParams: ['show', 'color'],
        title: 'Loan',
        // icon: 'sitemap',
        parent: 'microfis.clientAcc'
    }
});


// Repayment Quick Form
import '../imports/pages/repaymentQuickForm';
MicrofisRoutes.route('/repaymentQuickForm', {
    name: 'microfis.repaymentQuickForm',
    title: 'Repayment',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentQuickForm');
    },
    breadcrumb: {

        //queryParams: ['show', 'color'],
        title: 'Quick Form',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});


// Group Loan
import '../imports/pages/groupLoan';
MicrofisRoutes.route('/groupLoan', {
    name: 'microfis.groupLoan',
    title: 'Group Loan',
    action: function (params, queryParams) {
        Layout.main('Microfis_groupLoan');
    },
    breadcrumb: {

        //queryParams: ['show', 'color'],
        title: 'Group Loan',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});
// Group
import '../imports/pages/group';
MicrofisRoutes.route('/group', {
    name: 'microfis.group',
    title: 'Group',
    action: function (params, queryParams) {
        Layout.main('Microfis_group');
    },
    breadcrumb: {

        //queryParams: ['show', 'color'],
        title: 'Group',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Change CO
import '../imports/pages/changeCO';
MicrofisRoutes.route('/changeCO', {
    name: 'microfis.changeCO',
    title: 'Change CO',
    action: function (params, queryParams) {
        Layout.main('Microfis_changeCO');
    },
    breadcrumb: {

        //queryParams: ['show', 'color'],
        title: 'Change CO',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

/**********************
 * Saving
 *********************/

// Product
import '../imports/pages/saving-product.js';
MicrofisRoutes.route('/saving-product', {
    name: 'microfis.savingProduct',
    title: 'Saving Product',
    action: function (params, queryParams) {
        Layout.main('Microfis_savingProduct');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Product',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Transaction
import '../imports/pages/saving-transaction.js';
MicrofisRoutes.route('/saving-transaction/:clientId/:savingAccId', {
    name: 'microfis.savingTransaction',
    title: 'Saving',
    subscriptions: function (params, queryParams) {
        this.register('microfis.savingAccById', Meteor.subscribe('microfis.savingAccId', {_id: params.savingAccId}));
    },
    action: function (params, queryParams) {
        Layout.main('Microfis_savingTransaction');
    },
    breadcrumb: {
        params: ['clientId', 'savingAccId'],
        //queryParams: ['show', 'color'],
        title: 'Saving',
        // icon: 'sitemap',
        parent: 'microfis.clientAcc'
    }
});


// Product Status
import '../imports/pages/productStatus';
MicrofisRoutes.route('/productStatus', {
    name: 'microfis.productStatus',
    title: 'Product Status',
    action: function (params, queryParams) {
        Layout.main('Microfis_productStatus');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Product Status',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});
// Payment Status
import '../imports/pages/paymentStatus';
MicrofisRoutes.route('/paymentStatus', {
    name: 'microfis.paymentStatus',
    title: 'Payment Status',
    action: function (params, queryParams) {
        Layout.main('Microfis_paymentStatus');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Payment Status',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// End Of Process
import '../imports/pages/endOfProcess';
MicrofisRoutes.route('/endOfProcess', {
    name: 'microfis.endOfProcess',
    title: 'End Of Process',
    action: function (params, queryParams) {
        Layout.main('Microfis_endOfProcess');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'End Of Process',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Clear Prepay
import '../imports/pages/clearPrepay';
MicrofisRoutes.route('/clearPrepay', {
    name: 'microfis.clearPrepay',
    title: 'Clear Prepay',
    action: function (params, queryParams) {
        Layout.main('Microfis_clearPrepay');
    },
    breadcrumb: {
        //params: ['id'],
        //queryParams: ['show', 'color'],
        title: 'Clear Prepay',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

// Repayment Clear
MicrofisRoutes.route('/repaymentClear/:closeDate/:loanAccIdList/', {

    name: 'microfis.repaymentClear',
    title: 'Repayment Clear',
    action: function (params, queryParams) {
        Layout.main('Microfis_repaymentClear');
    },
    breadcrumb: {
        //queryParams: ['show', 'color'],
        title: 'Repayment Clear',
        // icon: 'sitemap',
        parent: 'microfis.clearPrepay'
    }
});



/*POS*/


// Purchase
import '../imports/pages/purchase';
MicrofisRoutes.route('/purchase', {
    name: 'microfis.purchase',
    title: 'Purchase',
    action: function (params, queryParams) {
        Layout.main('Microfis_purchase');
    },
    breadcrumb: {
        //queryParams: ['show', 'color'],
        title: 'Purchase',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});



// Category
import '../imports/pages/category';
MicrofisRoutes.route('/category', {
    name: 'microfis.category',
    title: 'Category',
    action: function (params, queryParams) {
        Layout.main('Microfis_category');
    },
    breadcrumb: {
        //queryParams: ['show', 'color'],
        title: 'Category',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});


// Group Category
import '../imports/pages/groupCategory';
MicrofisRoutes.route('/groupCategory', {
    name: 'microfis.groupCategory',
    title: 'Category',
    action: function (params, queryParams) {
        Layout.main('Microfis_groupCategory');
    },
    breadcrumb: {
        //queryParams: ['show', 'color'],
        title: 'Group Category',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});


// Vendor
import '../imports/pages/vendor';
MicrofisRoutes.route('/vendor', {
    name: 'microfis.vendor',
    title: 'Vendor',
    action: function (params, queryParams) {
        Layout.main('Microfis_vendor');
    },
    breadcrumb: {
        //queryParams: ['show', 'color'],
        title: 'Vendor',
        // icon: 'sitemap',
        parent: 'microfis.home'
    }
});

