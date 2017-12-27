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
import {Sale} from '../../common/collections/sale.js';
import {Client} from '../../common/collections/client';

// Tabular
import {SaleTabular} from '../../common/tabulars/sale';
// Page
import './sale.html';
import './loan-acc';

// Declare template
let indexTmpl = Template.Microfis_sale,
    actionTmpl = Template.Microfis_saleAction,
    newTmpl = Template.Microfis_saleNew,
    editTmpl = Template.Microfis_saleEdit,
    showTmpl = Template.Microfis_saleShow,
    productFormTmpl = Template.Microfis_loanAccProductForm;


let purchaseOpt=new ReactiveVar([]);
let price=new ReactiveVar(0);
let paid=new ReactiveVar(0);
let customerId=new ReactiveVar();
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('sale', {size: 'sm'});
    createNewAlertify('loanAccProduct', {size: 'sm'});
    createNewAlertify('saleShow');

});

indexTmpl.helpers({
    tabularTable(){
        return SaleTabular;
    }
});

indexTmpl.events({
    /*'click .js-create' (event, instance) {
        alertify.sale(fa('plus', 'sale'), renderTemplate(newTmpl));
    },*/
    /*'click .js-update' (event, instance) {
        debugger
        price.set(this.price);
        customerId.set(this.customerId);
        alertify.sale(fa('plus', 'Sale'), renderTemplate(editTmpl,this));
    },*/
    'click .js-destroy' (event, instance) {
        if(this.loanAccId){
            displayError("You need to delete from Loan Account");
        }else {
            destroyAction(
              Sale,
              {_id: this._id},
               {title: 'sale', itemTitle: this._id}
            );
        }
    },
    'click .js-display' (event, instance) {
        alertify.saleShow(fa('eye', 'sale'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Sale;
    },
    customerDoc(){
        let currentData = Template.currentData();
        let data = Client.findOne(currentData.customerId);
        return data;
    },
    purchaseOption(){
        return purchaseOpt.get();
    },
    price(){
        return price.get();
    },
    remaining(){
        return price.get()-paid.get();
    }
});

newTmpl.onCreated(function () {
    price.set(0);
    Meteor.call("microfis_purchaseOpt",Session.get("currentBranch"),function (err,result) {
        purchaseOpt.set(result);
    })
})

newTmpl.events({
    "change [name='purchaseId']"(e,t){
        let pricelabel=e.currentTarget.selectedOptions[0].label;
        let priceArr=pricelabel.split(" | ");
        price.set(parseFloat(priceArr[1]));

    },
    "keyup [name='paid']"(e,t){
        paid.set(e.currentTarget.value);
    }
})

// Edit
editTmpl.helpers({
    collection(){
        return Sale;
    },
    purchaseOption(){
        return purchaseOpt.get();
    },
    customerDoc(){
        let data = Client.findOne(customerId.get());
        return data;
    },
    price(){
        return price.get();
    }
});

editTmpl.events({
    "change [name='purchaseId']"(e,t){
        let pricelabel=e.currentTarget.selectedOptions[0].label;
        let priceArr=pricelabel.split(" | ");
        price.set(parseFloat(priceArr[1]));

    }
})

editTmpl.onCreated(function () {
    this.subscribe('microfis.clientById', customerId.get());
    Meteor.call("microfis_purchaseOpt",Session.get("currentBranch"),function (err,result) {
        purchaseOpt.set(result);
    })
})

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {

    before: {
        insert: function (doc) {
            debugger;
            if(doc.transactionType=="credit"){
                alertify.loanAccProduct(fa('plus', 'Loan Account Product'), renderTemplate(productFormTmpl,{purchaseId: doc.purchaseId}));
            }
            return doc;
        }
    },
    onSuccess (formType, result) {
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_saleNew',
    'Microfis_saleEdit'
], hooksObject);
