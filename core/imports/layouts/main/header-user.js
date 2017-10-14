import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {moment} from  'meteor/momentjs:moment';
import 'meteor/lbee:moment-helpers';

// Lib
import {Logout} from '../../../client/libs/logout.js';

import {Repayment} from '../../../../microfis/common/collections/repayment'

// Page
import './header-user.html';
let notPaidProblemList = new ReactiveVar([]);
let isLoading = new ReactiveVar(false);

Template._HeaderUserLayout.helpers({
    user: function () {
        let currentUser = Meteor.user();
        if (currentUser) {
            currentUser.emailsAddress = currentUser.emails[0].address;
            return currentUser;
        }
    }
    ,
    isNotification () {

        let currentModule = Session.get('currentModule');
        let isNot = false;
        if (currentModule == "Microfis") {
            isNot = true;
        }
        return isNot;
    },

    notRepaidNumber(){
        let selector = {};
        selector.branchId = Session.get("currentBranch");
        selector.detailDoc = undefined;
        selector.type = {$nin: ["Fee", "Write Off"]}
        Meteor.subscribe("microfis.repayment", selector);
        return Repayment.find(selector).count();
    },
    notPaidList(){
        return notPaidProblemList.get();
    },
    isLoading(){
        return isLoading.get();
    }
});


Template._HeaderUserLayout.events({
    'click .js-logout'(event, instance) {
        Logout();
    },
    'click .notPaid'(){
        isLoading.set(false);
        Meteor.call("microfis_getRepaymentNotPaid", Session.get("currentBranch"), function (err, result) {
            if (result) {
                notPaidProblemList.set(result.notPaidList);
                isLoading.set(true);
            } else if (result.length == 0) {
                isLoading.set(true);
            }

        })

    }
});
