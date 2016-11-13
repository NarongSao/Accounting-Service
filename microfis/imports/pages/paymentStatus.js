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
import {PaymentStatus} from '../../common/collections/paymentStatus.js';

// Tabular
import {PaymentStatusTabular} from '../../common/tabulars/paymentStatus.js';

// Page
import './paymentStatus.html';

// Declare template
let indexTmpl = Template.Microfis_paymentStatus,
    actionTmpl = Template.Microfis_paymentStatusAction,
    newTmpl = Template.Microfis_paymentStatusNew,
    editTmpl = Template.Microfis_paymentStatusEdit,
    showTmpl = Template.Microfis_paymentStatusShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('paymentStatus');
});

indexTmpl.helpers({
    tabularTable(){
        return PaymentStatusTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.paymentStatus(fa('plus', 'Product Status'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.paymentStatus(fa('pencil', 'Product Status'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            PaymentStatus,
            {_id: this._id},
            {title: 'Payment Status', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.paymentStatus(fa('eye', 'Payment Status'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return PaymentStatus;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.paymentStatus', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return PaymentStatus;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.paymentStatus', {_id: this.data._id});
    });
});


// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.paymentStatus().close();
        }
        $('[name="level"]').val(1);
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_paymentStatusNew',
    'Microfis_paymentStatusEdit'
], hooksObject);
