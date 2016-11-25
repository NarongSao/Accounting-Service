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
import {LoanAcc} from '../../common/collections/loan-acc.js';

// Method
import {lookupProduct} from '../../common/methods/lookup-product.js';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Tabular
import {LoanAccTabular} from '../../common/tabulars/loan-acc.js';

// Page
import './loan-acc.html';
import './reStructure.js';

// Declare template
let indexTmpl = Template.Microfis_loanAcc,
    actionTmpl = Template.Microfis_loanAccAction,
    productFormTmpl = Template.Microfis_loanAccProductForm,
    formTmpl = Template.Microfis_loanAccForm,
    showTmpl = Template.Microfis_loanAccShow;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('loanAccProduct');
    createNewAlertify('loanAcc', {size: 'lg'});
    createNewAlertify('loanAccShow');
});

indexTmpl.helpers({
    tabularTable(){
        return LoanAccTabular;
    },
    tabularSelector(){

        return {clientId: FlowRouter.getParam('clientId')};
    },
});

indexTmpl.events({
    'click .js-create-loan-acc' (event, instance) {
        alertify.loanAccProduct(fa('plus', 'Loan Account Product'), renderTemplate(productFormTmpl));
    },
    'click .js-update' (event, instance) {
        // $.blockUI();

        let self = this;

        if (this.paymentNumber > 0 || ["Active", "Check"].includes(this.status) == false) {
            alertify.error("Can't remove this account!!!");
        } else {
            lookupProduct.callPromise({
                _id: self.productId
            }).then(function (result) {
                Session.set('productDoc', result);

                // Meteor.setTimeout(function () {
                alertify.loanAcc(fa('pencil', 'Loan Account'), renderTemplate(formTmpl, {loanAccId: self._id})).maximize();

                // $.unblockUI();
                // }, 100);

            }).catch(function (err) {
                console.log(err.message);
            });
        }

    },

    'click .js-destroy' (event, instance) {
        if (this.paymentNumber > 0 || ["Active", "Check"].includes(this.status) == false) {
            alertify.error("Can't remove this account!!!");
        } else {
            destroyAction(
                LoanAcc,
                {_id: this._id},
                {title: 'Loan Account', itemTitle: this._id}
            );
        }
    },
    'click .js-display' (event, instance) {
        alertify.loanAccShow(fa('eye', 'Loan Account'), renderTemplate(showTmpl, this));
    },
    'dblclick tbody > tr': function (event) {
        var dataTable = $(event.target).closest('table').DataTable();
        var rowData = dataTable.row(event.currentTarget).data();

        let params = {
            clientId: FlowRouter.getParam('clientId'),
            loanAccId: rowData._id
        };

        FlowRouter.go('microfis.repayment', params);
    }
});

// Product Form
productFormTmpl.helpers({
    productSchema(){
        return LoanAcc.productSchema;
    }
});

productFormTmpl.events({
    'change [name="productId"]'(event, instance){
        let productId = event.currentTarget.value;
        Session.set('productDoc', null);

        if (productId) {
            $.blockUI();

            lookupProduct.callPromise({
                _id: productId
            }).then(function (result) {
                Session.set('productDoc', result);

                Meteor.setTimeout(function () {
                    $.unblockUI();
                }, 100);

            }).catch(function (err) {
                console.log(err.message);
            });
        }

    },
    'click .btn-default'(event, instance){
        alertify.loanAccProduct().close();
    }
});

productFormTmpl.onDestroyed(function () {
    Session.set('productDoc', null);
});

AutoForm.hooks({
    Microfis_loanAccProductForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            this.event.preventDefault();
            this.done();
        },
        onSuccess: function (formType, result) {
            alertify.loanAcc(fa('plus', 'Loan Account'), renderTemplate(formTmpl)).maximize();
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
            this.subscribe('microfis.loanAccById', currentData.loanAccId);
        }
    });
});

formTmpl.onRendered(function () {
    let $submitDate = $('[name="submitDate"]');
    let $disbursementDate = $('[name="disbursementDate"]');
    let $firstRepaymentDate = $('[name="firstRepaymentDate"]');
    let productDoc = Session.get('productDoc');

    $disbursementDate.data("DateTimePicker").minDate(moment(productDoc.startDate).startOf('day'));
    $disbursementDate.data("DateTimePicker").maxDate(moment(productDoc.endDate).endOf('day'));


    // LoanAcc date change
    $disbursementDate.on("dp.change", function (e) {
        $submitDate.data("DateTimePicker").maxDate(moment(e.date).startOf('day'));
        $firstRepaymentDate.data("DateTimePicker").minDate(moment(e.date).add(1, 'days').startOf('day'));
    });
});

formTmpl.helpers({
    dataHeader(){
        return Session.get('productDoc');
    },
    collection(){
        return LoanAcc;
    },
    data(){
        let doc = {}, formType = 'insert';
        let currentData = Template.currentData();

        if (currentData) {
            doc = LoanAcc.findOne({_id: currentData.loanAccId});
            formType = 'update';
        }

        return {doc, formType};
    },
    cycle(){
        let currentData = Template.currentData();
        if(!currentData){
            return stateClient.get('cycle')+1;
        }
    }
});

formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_loanAccForm");
});

// Hook
let hooksObject = {


    onSuccess (formType, result) {
        if (formType == "insert" && result.status != "Restructure") {
            stateClient.set("cycle", stateClient.get('cycle') + 1);
        }

        alertify.loanAcc().close();
        alertify.loanAccProduct().close();
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_loanAccForm'
], hooksObject);

// Show
showTmpl.onCreated(function () {
    let self = this;
    self.dataLookup = new ReactiveVar(false);

    self.autorun(function () {
        let currentData = Template.currentData();

        lookupLoanAcc.callPromise({
            _id: currentData._id
        }).then(function (result) {
            self.dataLookup.set(result);
        }).catch(function (err) {
            console.log(err.message);
        });
    });
});

showTmpl.helpers({
    data: function () {
        let data = Template.instance().dataLookup.get();
        // data.attachFileUrl = null;
        // if (data.photo) {
        //     let file = Files.findOne(data.attachFile);
        //     data.attachFileUrl = file.url();
        // }

        return data;
    }
});
