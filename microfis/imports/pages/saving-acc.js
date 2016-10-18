import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import fx from 'money';

// Lib
import {createNewAlertify} from '../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../core/client/libs/display-alert.js';
import {__} from '../../../core/common/libs/tapi18n-callback-helper.js';


// Component
import '../../../core/client/components/loading.js';
import '../../../core/client/components/column-action.js';
import '../../../core/client/components/form-footer.js';
import '../../../core/client/components/add-new-button.js';

// Collection
import {Client} from '../../common/collections/client.js';
import {SavingAcc} from '../../common/collections/saving-acc';
import {SavingProduct} from '../../common/collections/saving-product';

// Tabular
import {SavingAccTabular} from '../../common/tabulars/saving-acc.js';

// Page
import './saving-acc.html';

// Declare template
let indexTmpl = Template.Microfis_savingAcc,
    actionTmpl = Template.Microfis_savingAccAction,
    productFormTmpl = Template.Microfis_savingAccProductForm,
    formTmpl = Template.Microfis_savingAccForm,
    showTmpl = Template.Microfis_savingAccShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('savingAccProduct');
    createNewAlertify('savingAcc', {size: 'lg'});
    createNewAlertify('savingAccShow');
});

indexTmpl.helpers({
    tabularTable(){
        return SavingAccTabular;
    },
    tabularSelector(){
        return {clientId: FlowRouter.getParam('clientId')};
    },
});

indexTmpl.events({
    'click .js-create-saving-acc' (event, instance) {
        alertify.savingAccProduct(fa('plus', 'Saving Account Product'), renderTemplate(productFormTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.savingAcc(fa('pencil', 'Saving Account'), renderTemplate(formTmpl, this)).maximize();
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            SavingAcc,
            {_id: this._id},
            {title: 'Saving Account', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.savingAccShow(fa('eye', 'Saving Account'), renderTemplate(showTmpl, this));
    },
    'dblclick tbody > tr': function (event) {
        var dataTable = $(event.target).closest('table').DataTable();
        var rowData = dataTable.row(event.currentTarget).data();

        let params = {
            clientId: FlowRouter.getParam('clientId'),
            savingAccId: rowData._id
        };
        FlowRouter.go('microfis.savingTransaction', params);
    }
});

// Product Form
productFormTmpl.onCreated(function () {
    this.productIdState = new ReactiveVar();

    this.autorun(()=> {
        if (this.productIdState.get()) {
            let handle = this.subscribe('microfis.savingProductById', this.productIdState.get());
            if (handle.ready()) {
                let productDoc = SavingProduct.findOne(this.productIdState.get());
                Session.set('savingProductDoc', productDoc);
            }
        }
    });
});

productFormTmpl.helpers({
    productSchema(){
        return SavingAcc.productSchema;
    },
});

productFormTmpl.events({
    'change [name="productId"]'(event, instance){
        instance.productIdState.set(event.currentTarget.value);
    },
    'click .btn-default'(event, instance){
        alertify.savingAccProduct().close();
    }
});

productFormTmpl.onDestroyed(function () {
    Session.set('savingProductDoc', null);
});

AutoForm.hooks({
    Microfis_savingAccProductForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            this.event.preventDefault();
            this.done();
        },
        onSuccess: function (formType, result) {
            alertify.savingAcc(fa('plus', 'Saving Account'), renderTemplate(formTmpl)).maximize();
        },
        onError: function (formType, error) {
            displayError(error.message);
        }
    }
});

// Form
formTmpl.onCreated(function () {
    this.autorun(()=> {
        let currentData = Template.currentData();

        if (currentData) {
            let productHandle = this.subscribe('microfis.savingProductById', currentData.productId);
            if (productHandle.ready()) {
                let productDoc = SavingProduct.findOne({_id: currentData.productId});
                Session.set('savingProductDoc', productDoc);

                // Meteor.setTimeout(()=>{
                this.subscribe('microfis.savingAccById', currentData._id);
                // }, 200);
            }
        }
    });
});

formTmpl.onRendered(function () {
});

formTmpl.helpers({
    dataHeader(){
        return Session.get('savingProductDoc');
    },
    collection(){
        return SavingAcc;
    },
    data(){
        let doc = {}, formType = 'insert';
        let currentData = Template.currentData();

        if (currentData) {
            doc = SavingAcc.findOne({_id: currentData._id});
            doc.productDoc = SavingProduct.findOne({_id: currentData.productId});
            formType = 'update';
        }

        return {doc, formType};
    },
});

formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_savingAccForm");
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            doc.status = {value: 'Inactive'};
            return doc;
        }
    },
    onSuccess (formType, result) {
        alertify.savingAcc().close();
        alertify.savingAccProduct().close();
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_savingAccForm'
], hooksObject);

// Show
showTmpl.onCreated(function () {
    this.autorun(() => {
        let currentData = Template.currentData();
        if (currentData) {
            this.subscribe('microfis.savingProductById', currentData.productId);
            this.subscribe('microfis.savingAccById', currentData._id);
        }
    });
});

showTmpl.helpers({
    data: function () {
        let data;
        let currentData = Template.currentData();

        if (currentData) {
            data = SavingAcc.findOne({_id: currentData._id});
            data.productDoc = SavingProduct.findOne({_id: currentData.productId});
        }

        return data;
    }
});
