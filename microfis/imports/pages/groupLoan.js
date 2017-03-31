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
        alertify.groupLoan(fa('plus', 'Group Loan'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
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
newTmpl.helpers({
    collection(){
        return GroupLoan;
    },

    groupLoanDetailCollection(){
        return groupLoanDetailCollection;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return GroupLoan;
    },
    groupLoanDetailCollection(){
        return groupLoanDetailCollection;
    }
});

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
                    loan.push({account: obj.id})
                });
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