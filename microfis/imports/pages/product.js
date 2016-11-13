import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
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
import {Product} from '../../common/collections/product.js';

// Method
import {lookupProduct} from '../../common/methods/lookup-product.js';

// Page
import './product.html';

// Declare template
let indexTmpl = Template.Microfis_product,
    actionTmpl = Template.Microfis_productAction,
    formTmpl = Template.Microfis_productForm,
    showTmpl = Template.Microfis_productShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify("product");
});

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.product';
        reactiveTableSettings.fields = [
            // General
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'desc'
            },
            {key: 'name', label: 'Name'},
            {key: 'shortName', label: 'Short Name', hidden: true},
            {key: 'des', label: 'Description', hidden: true},
            {key: 'startDate', label: 'Start Date', hidden: true},
            {key: 'endDate', label: 'End Date', hidden: true},
            // Account
            {key: 'accountType', label: 'Account Type'},
            {key: 'currencyId', label: 'Currency'},
            {key: 'exchange', label: 'Exchange', hidden: true},
            {key: 'microfisAmount', label: 'Microfis Amount', hidden: true},
            // Payment
            {key: 'paymentMethod', label: 'Payment Method'},
            {key: 'term', label: 'Term', hidden: true},
            // Interest
            {key: 'interestMethod', label: 'Interest Method'},
            {key: 'interestRate', label: 'Interest', hidden: true},
            // Charge
            {key: 'feeId', label: 'Fee', hidden: true},
            {key: 'penaltyId', label: 'Penalty', hidden: true},
            {key: 'penaltyClosingId', label: 'Penalty Closing', hidden: true},
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
        alertify.product(fa('plus', 'Product'), renderTemplate(formTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.product(fa('pencil', 'Product'), renderTemplate(formTmpl, this)).maximize();
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Product,
            {_id: this._id},
            {title: 'Product', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.product(fa('eye', 'Product'), renderTemplate(showTmpl, this));
    }
});

// Form
formTmpl.helpers({
    collection(){
        return Product;
    },
    formType () {
        let updateDoc = this;
        if (updateDoc._id) {
            return 'update'
        }

        return 'insert';
    }
});

formTmpl.onDestroyed(function () {
});

// Show
showTmpl.onCreated(function () {
    let self = this;
    self.productDoc = new ReactiveVar();

    self.autorun(function () {
        let currentData = Template.currentData();

        lookupProduct.callPromise({
            _id: currentData._id
        }).then(function (result) {
            self.productDoc.set(result);
        }).catch(function (err) {
            console.log(err.message);
        });
    });
});
showTmpl.helpers({
    data(){
        const instance = Template.instance();
        return instance.productDoc.get();
    },
    jsonViewOpts(){
        let opts = {collapsed: false};
        return opts;
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
    'Microfis_productForm'
], hooksObject);
