import {Template} from 'meteor/templating';
import {EJSON} from 'meteor/ejson';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';
import '../../../../core/client/components/add-new-button.js';

// Collection
import {LookupValue} from '../../api/collections/lookup-value.js';

// Page
import './lookup-value.html';

// Declare template
let indexTmpl = Template.Microfis_lookupValue,
    actionTmpl = Template.Microfis_lookupValueAction,
    formTmpl = Template.Microfis_lookupValueForm,
    showTmpl = Template.Microfis_lookupValueShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('lookupValue');
});

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.lookupValue';
        reactiveTableSettings.fields = [
            {
                key: 'name',
                label: 'Name',
                sortOrder: 0,
                sortDirection: 'esc'
            },
            {key: 'private', label: 'Private'},
            {
                key: 'options',
                label: 'Options',
                fn (value, object, key) {
                    let html = '<ul>';
                    value.forEach(function (o) {
                        html += '<li>' + EJSON.stringify(o, 5) + '</li>';
                    });
                    html += '</ul';
                    return Spacebars.SafeString(html);
                }
            },
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
        alertify.lookupValue(fa('plus', 'Lookup Value'), renderTemplate(formTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.lookupValue(fa('pencil', 'Lookup Value'), renderTemplate(formTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            LookupValue,
            {_id: this._id},
            {title: 'Lookup Value', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.lookupValue(fa('eye', 'Lookup Value'), renderTemplate(showTmpl, this));
    }
});

// Form
formTmpl.helpers({
    collection(){
        return LookupValue;
    },
    formType () {
        let updateDoc = this;
        if (updateDoc._id) {
            return 'update'
        }

        return 'insert';
    }
});

// Show
showTmpl.helpers({
    jsonViewOpts(){
        let opts = {collapsed: false};
        return opts;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.lookupValue().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks(['Microfis_lookupValueForm'], hooksObject);
