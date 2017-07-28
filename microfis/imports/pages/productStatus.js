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
import {ProductStatus} from '../../common/collections/productStatus';

// Tabular
import {ProductStatusTabular} from '../../common/tabulars/productStatus';

// Page
import './productStatus.html';

// Declare template
let indexTmpl = Template.Microfis_productStatus,
    actionTmpl = Template.Microfis_productStatusAction,
    newTmpl = Template.Microfis_productStatusNew,
    editTmpl = Template.Microfis_productStatusEdit,
    showTmpl = Template.Microfis_productStatusShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('productStatus');
});

indexTmpl.helpers({
    tabularTable(){
        return ProductStatusTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.productStatus(fa('plus', 'Product Status'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.productStatus(fa('pencil', 'Product Status'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            ProductStatus,
            {_id: this._id},
            {title: 'Product Status', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.productStatus(fa('eye', 'Product Status'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return ProductStatus;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.productStatus', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return ProductStatus;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.productStatus', {_id: this.data._id});
    });
});


// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.productStatus().close();
        }
        $('[name="level"]').val(1);
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_productStatusNew',
    'Microfis_productStatusEdit'
], hooksObject);
