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
import {Vendor} from '../../common/collections/vendor.js';

// Tabular
import {VendorTabular} from '../../common/tabulars/vendor';
// Page
import './vendor.html';

// Declare template
let indexTmpl = Template.Microfis_vendor,
    actionTmpl = Template.Microfis_vendorAction,
    newTmpl = Template.Microfis_vendorNew,
    editTmpl = Template.Microfis_vendorEdit,
    showTmpl = Template.Microfis_vendorShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('vendor', {size: 'sm'});
    createNewAlertify('vendorShow');
});

indexTmpl.helpers({
    tabularTable(){
        return VendorTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.vendor(fa('plus', 'Vendor'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.vendor(fa('pencil', 'Vendor'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Vendor,
            {_id: this._id},
            {title: 'Vendor', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.vendorShow(fa('eye', 'Vendor'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Vendor;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return Vendor;
    }
});

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.vendor().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_vendorNew',
    'Microfis_vendorEdit'
], hooksObject);
