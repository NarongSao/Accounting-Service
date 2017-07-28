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
import {Fund} from '../../common/collections/fund.js';

// Tabular
import {FundTabular} from '../../common/tabulars/fund';
// Page
import './fund.html';

// Declare template
let indexTmpl = Template.Microfis_fund,
    actionTmpl = Template.Microfis_fundAction,
    newTmpl = Template.Microfis_fundNew,
    editTmpl = Template.Microfis_fundEdit,
    showTmpl = Template.Microfis_fundShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('fund', {size: 'lg'});
    createNewAlertify('fundShow');
});

indexTmpl.helpers({
    tabularTable(){
        return FundTabular;
    },

    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.fund';
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'desc'
            },
            {key: 'name', label: 'Name'},
            {key: 'shortName', label: 'Short Name', hidden: true},
            {
                key: 'registerDate',
                label: 'Register Date',
                fn (value, object, key) {
                    return moment(value).format('DD/MM/YYYY');
                }
            },
            {key: 'address', label: 'Address', hidden: true},
            {key: 'telephone', label: 'Telephone'},
            {key: 'email', label: 'email'},
            {key: 'websit', label: 'Website', hidden: true},
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
        alertify.fund(fa('plus', 'Fund'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.fund(fa('pencil', 'Fund'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Fund,
            {_id: this._id},
            {title: 'Fund', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.fundShow(fa('eye', 'Fund'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Fund;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return Fund;
    }
});

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.fund().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_fundNew',
    'Microfis_fundEdit'
], hooksObject);
