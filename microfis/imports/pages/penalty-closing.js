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

// Collection
import {PenaltyClosing} from '../../common/collections/penalty-closing.js';

// Page
import './penalty-closing.html';

// Declare template
let indexTmpl = Template.Microfis_penaltyClosing,
    actionTmpl = Template.Microfis_penaltyClosingAction,
    newTmpl = Template.Microfis_penaltyClosingNew,
    editTmpl = Template.Microfis_penaltyClosingEdit,
    showTmpl = Template.Microfis_penaltyClosingShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('penaltyClosing');
});
let statePenaltyClosing = new ReactiveObj();

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.penaltyClosing';
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'desc'
            },
            {key: 'name', label: 'Name'},
            {key: 'installmentTermLessThan', label: 'Installment Term Less Than'},
            {key: 'installmentType', label: 'Installment Type'},
            {key: 'penaltyRemainderTypeOf', label: 'Penalty Remainder Type'},
            {key: 'interestRemainderCharge', label: 'Interest Remainder Charge'},
            {key: 'calculateType', label: 'Calculate Type'},
            {key: 'numberOfProduct', label: 'Number'},

            {
                key: '_id',
                label(){
                    return fa('bars', '', true);
                },
                headerClass: function () {
                    let css = 'text-center col-action';
                    return css;
                },
                tmpl: actionTmpl, sortable: false
            }
        ];

        return reactiveTableSettings;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        statePenaltyClosing.set('isPenaltyRemainderTypeOf', false);
        alertify.penaltyClosing(fa('plus', 'PenaltyClosing'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        statePenaltyClosing.set('isPenaltyRemainderTypeOf', false);
        if (this.calculateType == "P") {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', true);
        } else {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', false);
        }
        alertify.penaltyClosing(fa('pencil', 'PenaltyClosing'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {

        if (this.numberOfProduct <= 0) {
            destroyAction(
                PenaltyClosing,
                {_id: this._id},
                {title: 'PenaltyClosing', itemTitle: this._id}
            );
        } else {
            alertify.warning("Already have relation with product");
        }
    },
    'click .js-display' (event, instance) {
        alertify.penaltyClosing(fa('eye', 'PenaltyClosing'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return PenaltyClosing;
    },
    isPenaltyRemainderTypeOf(){
        return statePenaltyClosing.get("isPenaltyRemainderTypeOf");
    }
});

newTmpl.events({
    'change [name="calculateType"]'(e, t){
        if (e.currentTarget.value == "P") {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', true);
        } else {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', false);
        }
    }
})

// Edit
editTmpl.helpers({
    collection(){
        return PenaltyClosing;
    },
    isPenaltyRemainderTypeOf(){
        return statePenaltyClosing.get("isPenaltyRemainderTypeOf");
    }
});

editTmpl.events({
    'change [name="calculateType"]'(e, t){
        if (e.currentTarget.value == "P") {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', true);
        } else {
            statePenaltyClosing.set('isPenaltyRemainderTypeOf', false);
        }
    }
})


// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.penaltyClosing().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_penaltyClosingNew',
    'Microfis_penaltyClosingEdit'
], hooksObject);
