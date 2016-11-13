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
