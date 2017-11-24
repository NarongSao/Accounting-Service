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
import {Purchase} from '../../common/collections/purchase.js';

// Tabular
import {PurchaseTabular} from '../../common/tabulars/purchase';
// Page
import './purchase.html';

// Declare template
let indexTmpl = Template.Microfis_purchase,
    actionTmpl = Template.Microfis_purchaseAction,
    newTmpl = Template.Microfis_purchaseNew,
    editTmpl = Template.Microfis_purchaseEdit,
    showTmpl = Template.Microfis_purchaseShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('purchase', {size: 'lg'});
    createNewAlertify('purchaseShow');
});

indexTmpl.helpers({
    tabularTable(){
        return PurchaseTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.purchase(fa('plus', 'purchase'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        if(this.status==false){
             alertify.purchase(fa('pencil', 'purchase'), renderTemplate(editTmpl, this));
        }else {
            alertify.error("Can't Update");
        }
    },
    'click .js-destroy' (event, instance) {
        if(this.status==false){
            destroyAction(
              Purchase,
              {_id: this._id},
               {title: 'purchase', itemTitle: this._id}
          );
        }else {
            alertify.error("Can't remove");
        }
    },
    'click .js-display' (event, instance) {
        alertify.purchaseShow(fa('eye', 'purchase'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Purchase;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return Purchase;
    }
});

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.purchase().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_purchaseNew',
    'Microfis_purchaseEdit'
], hooksObject);
