import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';

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

// Collection
import {SavingProduct} from '../../api/collections/saving-product';


// Tabular
import {SavingProductTabular} from '../../../common/tabulars/saving-product.js';

// Page
import './saving-product.html';

// Declare template
let indexTmpl = Template.Microfis_savingProduct,
    actionTmpl = Template.Microfis_savingProductAction,
    formTmpl = Template.Microfis_savingProductForm,
    showTmpl = Template.Microfis_savingProductShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify("product");
});

indexTmpl.helpers({
    tabularTable(){
        return SavingProductTabular;
    },
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.product(fa('plus', 'Saving Product'), renderTemplate(formTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.product(fa('pencil', 'Saving Product'), renderTemplate(formTmpl, this)).maximize();
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            SavingProduct,
            {_id: this._id},
            {title: 'Product', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.product(fa('eye', 'Saving Product'), renderTemplate(showTmpl, this));
    }
});

// Form
formTmpl.onCreated(function () {
    this.accountClassState = new ReactiveVar('E');
    this.interestMethodState = new ReactiveVar('Y');

    this.autorun(()=> {
        let currentData = Template.currentData();
        if (currentData) {
            this.accountClassState.set(currentData.accountClass);
            this.interestMethodState.set(currentData.interestMethod);

            this.subscribe('microfis.savingProductById', currentData._id);
        }
    });
});

formTmpl.helpers({
    collection(){
        return SavingProduct;
    },
    data(){
        let doc = {}, formType = 'insert';
        let currentData = Template.currentData();

        if (currentData) {
            doc = SavingProduct.findOne({_id: currentData._id});
            formType = 'update';
        }

        return {doc, formType};
    },
    accountClassDependAttr(){
        const instance = Template.instance();
        let accountClass = instance.accountClassState.get();

        if (accountClass == 'T') {
            return {readonly: false, value: 1};
        }

        return {readonly: true, value: 0};
    },
    daysInMethodVal(){
        const instance = Template.instance();
        const currentData = Template.currentData();

        let interestMethodState = instance.interestMethodState.get();

        // Current data exist
        if (currentData) {
            if (interestMethodState == currentData.interestMethod) {
                return currentData.daysInMethod;
            }
        }

        if (interestMethodState == 'M') {
            return 30;
        }

        return 365;
    }
});

formTmpl.events({
    'change [name="accountClass"]'(event, instance){
        instance.accountClassState.set(event.currentTarget.value);
    },
    'change [name="interestMethod"]'(event, instance){
        instance.interestMethodState.set(event.currentTarget.value);
    }
});

formTmpl.onDestroyed(function () {
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        let currentData = Template.currentData();
        if (currentData) {
            this.subscribe('microfis.savingProductById', currentData._id);
        }
    });
});
showTmpl.helpers({
    data(){
        let currentData = Template.currentData();
        let data = SavingProduct.findOne({_id: currentData._id});
        data.exchangeVal = EJSON.stringify(data.exchange);
        data.interestRateVal = EJSON.stringify(data.interestRate);

        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.product().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_savingProductForm'
], hooksObject);
