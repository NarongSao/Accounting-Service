import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Lib
import {createNewAlertify} from '../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../core/client/components/loading.js';
import '../../../core/client/components/column-action.js';
import '../../../core/client/components/form-footer.js';
import '../../../core/client/components/add-new-button.js';

// Collection
import {GroupLoan} from '../../common/collections/groupLoan.js';
// Tabular
import {GroupLoanTabular} from '../../common/tabulars/groupLoan.js';
// Page
import './groupLoan.html';
import './groupLoanDetail';

// Declare template
let indexTmpl = Template.Microfis_groupLoan,
    actionTmpl = Template.Microfis_groupLoanAction,
    newTmpl = Template.Microfis_groupLoanNew,
    editTmpl = Template.Microfis_groupLoanEdit,
    showTmpl = Template.Microfis_groupLoanShow;


var groupLoanDetailCollection = new Mongo.Collection(null);
let code = new ReactiveVar("");
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('groupLoan');
});

indexTmpl.helpers({
    tabularTable(){
        return GroupLoanTabular;
    },
    tabularSelector(){
        return {branchId: Session.get('currentBranch')};
    },
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        Session.set("groupStatus", [false])
        alertify.groupLoan(fa('plus', 'Group Loan'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {

        Session.set("groupStatus", [false, true]);
        let self = this;
        Meteor.call("microfis_getGroupById", self.groupId, function (err, result) {
            if (result) {
                locationChange.set(result.locationId);
            } else {
                locationChange.set("");
            }
        })

        alertify.groupLoan(fa('pencil', 'Group Loan'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            GroupLoan,
            {_id: this._id},
            {title: 'Group Loan', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.groupLoan(fa('eye', 'Group Loan'), renderTemplate(showTmpl, this));
    }
});

// New

newTmpl.onRendered(function () {
    this.autorun(function () {
        Meteor.call("microfis_getCodeGroup", Session.get("currentBranch"), function (err, result) {
            if (result) {
                code.set(parseInt((result.code).substr(8, 13)) + 1);
            } else {
                code.set("000001");
            }

        })
    })
})

newTmpl.helpers({
    collection(){
        return GroupLoan;
    },

    groupLoanDetailCollection(){
        return groupLoanDetailCollection;
    },
    code(){
        return code.get();
    }
});

newTmpl.events({
    'change [name="groupId"]'(e, t){
        let group = $(e.currentTarget).val();
        Meteor.call("microfis_getGroupById", group, function (err, result) {
            if (result) {
                locationChange.set(result.locationId);
            } else {
                locationChange.set("");
            }
        })
    }
})

// Edit
editTmpl.helpers({
    collection(){
        return GroupLoan;
    },
    groupLoanDetailCollection(){
        return groupLoanDetailCollection;
    }
});


editTmpl.events({
    'change [name="groupId"]'(e, t){
        let group = $(e.currentTarget).val();
        Meteor.call("microfis_getGroupById", group, function (err, result) {
            if (result) {
                locationChange.set(result.locationId);
            } else {
                locationChange.set("");
            }
        })
    }
})

// Show
showTmpl.helpers({});

//Hook
AutoForm.hooks({
    Microfis_groupLoanNew: {
        before: {
            insert: function (doc) {
                let loanData = groupLoanDetailCollection.find().fetch();

                var loan = [];
                loanData.forEach(function (obj) {
                    loan.push({id: obj.id})
                });
                doc.loan = loan;
                doc.groupName = $('[name="groupId"] option:selected').text();

                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.groupLoan().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
    , Microfis_groupLoanEdit: {
        before: {
            update: function (doc) {

                let loanData = groupLoanDetailCollection.find().fetch();

                var loan = [];
                loanData.forEach(function (obj) {
                    loan.push({id: obj.id})
                });

                doc.$set.groupName = $('[name="groupId"] option:selected').text();
                doc.$set.loan = loan;
                doc.$unset = {};
                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.groupLoan().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
});