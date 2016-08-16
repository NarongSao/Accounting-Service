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
import '../../core/imports/ui/layouts/login';
import '../../core/imports/ui/layouts/main';

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
import '../imports/ui/pages/home.js';
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
import '../imports/ui/pages/lookup-value.js';
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
import '../imports/ui/pages/setting.js';
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
import '../imports/ui/pages/location.js';
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
import '../imports/ui/pages/fee.js';
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
import '../imports/ui/pages/fund.js';
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
import '../imports/ui/pages/holiday.js';
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
import '../imports/ui/pages/penalty.js';
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
import '../imports/ui/pages/penalty-closing.js';
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
import '../imports/ui/pages/product.js';
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
import '../imports/ui/pages/credit-officer.js';
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
import '../imports/ui/pages/guarantor.js';
MicrofisRoutes.route('/guarantor', {
    name: 'microfis.guarantor',
    title: 'uarantor',
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
import '../imports/ui/pages/client.js';
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
import '../imports/ui/pages/client-acc.js';
MicrofisRoutes.route('/client-acc/:clientId', {
    name: 'microfis.clientAcc',
    title: 'Client Account',
    subscriptions: function (params, queryParams) {
        this.register('microfis.clientById', Meteor.subscribe('microfis.clientById', params.clientId));
    },
    action: function (params, queryParams) {
        Layout.main('Microfis_clientAcc');
    },
    breadcrumb: {
        params: ['clientId'],
        //queryParams: ['show', 'color'],
        title: 'Client Account',
        // icon: 'sitemap',
        parent: 'microfis.client'
    }
});

// Repayment
import '../imports/ui/pages/repayment.js';
MicrofisRoutes.route('/repayment/:clientId/:loanAccId', {
    name: 'microfis.repayment',
    title: 'Repayment',
    subscriptions: function (params, queryParams) {
        this.register('microfis.loanAccById', Meteor.subscribe('microfis.loanAcc', {_id: params.loanAccId}));
        // this.register('microfis.loanAccAggregateById', Meteor.subscribe('microfis.loanAccAggregateById', params.loanAccId));
        this.register('microfis.scheduleByLoanAccId', Meteor.subscribe('microfis.scheduleByLoanAccId', params.loanAccId));
    },
    action: function (params, queryParams) {
        Layout.main('Microfis_repayment');
    },
    breadcrumb: {
        params: ['clientId', 'loanAccId'],
        //queryParams: ['show', 'color'],
        title: 'Repayment',
        // icon: 'sitemap',
        parent: 'microfis.loanAcc'
    }
});

/**********************
 * Saving
 *********************/

// Product
import '../imports/ui/pages/saving-product.js';
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
import '../imports/ui/pages/saving-transaction.js';
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
