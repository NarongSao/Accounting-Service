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

import {SavingAcc} from '../../common/collections/saving-acc.js';
import {EndOfProcess} from '../../common/collections/endOfProcess'

// Method
import {lookupProduct} from '../../common/methods/lookup-product.js';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Tabular
import {LoanAccTabular} from '../../common/tabulars/loan-acc.js';

// Page
import './loan-acc.html';
import './saving-acc.html';
import './sale';
import './reStructure.js';

// Declare template
let indexTmpl = Template.Microfis_loanAcc,
    actionTmpl = Template.Microfis_loanAccAction,
    productFormTmpl = Template.Microfis_loanAccProductForm,
    formTmpl = Template.Microfis_loanAccForm,
    savingAddOnTpl = Template.Microfis_savingAddOnAgent,
    showTmpl = Template.Microfis_loanAccShow,

    saleTml=Template.Microfis_saleNew;


let purchaseId=new ReactiveVar("");

let state = new ReactiveObj({
    disbursmentDate: moment().toDate()
});

stateSavingAddOn = new ReactiveObj({
    isAddmoreSaving: false
});

let isPreloader = true;
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('loanAccProduct');
    createNewAlertify('saleForm', {size: 'lg'});
    createNewAlertify('loanAcc', {size: 'lg'});
    createNewAlertify('loanAccShow');
    createNewAlertify('savingAccProduct');

    stateClient.set('escapeFrequency', true);
});

indexTmpl.helpers({
    tabularTable(){
        return LoanAccTabular;
    },
    tabularSelector(){

        return {clientId: FlowRouter.getParam('clientId')};
    },
});

Tracker.autorun(function () {
    if (state.get("disbursmentDate")) {
        Meteor.call("microfis_getSavingAccByDate", state.get("disbursmentDate"), FlowRouter.getParam('clientId'), function (err, result) {
            Session.set("savingList", result);
        })
    }

    if (stateSavingAddOn.get("isAddmoreSaving") == true) {
        Meteor.call("microfis_getSavingAccByDate", state.get("disbursmentDate"), FlowRouter.getParam('clientId'), function (err, result) {
            Session.set("savingList", result);
            stateSavingAddOn.set("isAddmoreSaving", false);
        })

    }

})

indexTmpl.events({
    'click .js-create-loan-acc' (event, instance) {
        purchaseId.set("");
        state.set("disbursmentDate", moment().toDate());

        alertify.loanAccProduct(fa('plus', 'Loan Account Product'), renderTemplate(productFormTmpl));
    },
    'click .js-create-sale' (event, instance) {
        let clientId=FlowRouter.getParam('clientId')
        alertify.saleForm(fa('plus', 'Sale'), renderTemplate(saleTml,{customerId: clientId}));
    },
    'click .js-update' (event, instance) {
        if(this.saleId){
            displayError("Can't update ,you need to remove this account and create new one!!!!");
        }else {

        $.blockUI({overlayCSS: {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'}});

        let self = this;
        state.set("currencyId", self.currencyId);
        state.set("disbursmentDate", self.disbursementDate);

        if (this.paymentNumber > 0 || ["Active", "Check"].includes(this.status) == false) {
            alertify.error("Can't Update this account!!!");
            Meteor.setTimeout(function () {
                $.unblockUI();
            }, 300)
        } else {
            lookupProduct.callPromise({
                _id: self.productId
            }).then(function (result) {
                Session.set('productDoc', result);


                alertify.loanAcc(fa('pencil', 'Loan Account'), renderTemplate(formTmpl, {loanAccId: self._id})).maximize();
                Meteor.setTimeout(function () {
                    $.unblockUI();
                }, 200)

            }).catch(function (err) {
                console.log(err.message);
                Meteor.setTimeout(function () {
                    $.unblockUI();
                }, 300)
            });
        }

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
            stateClient.set('cycle', stateClient.get('cycle') - 1);
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
            loanAccId: rowData._id,
            savingAccId: rowData.savingAccId
        };

        FlowRouter.go('microfis.repayment', params);
    }
});

// Product Form
productFormTmpl.helpers({
    productSchema(){
        return LoanAcc.productSchema;
    },
    currencyId(){
        return state.get("currencyId");
    }
});

productFormTmpl.events({
    'change [name="productId"]'(event, instance){
        let productId = event.currentTarget.value;
        Session.set('productDoc', null);

        if (productId) {
            $.blockUI({overlayCSS: {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'}});

            lookupProduct.callPromise({
                _id: productId
            }).then(function (result) {
                Session.set('productDoc', result);
                let interestDefaultRate = result.interestRate.defaultRate;

                state.set("defaultRate", interestDefaultRate);

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

productFormTmpl.onCreated(function () {
    let currentPurchase=Template.currentData();
    if(currentPurchase){
        purchaseId.set(currentPurchase.purchaseId);
    }
})

productFormTmpl.onDestroyed(function () {
    Session.set('productDoc', null);
    Session.set("savingList", null);
    state.set("disbursmentDate", null);

    AutoForm.resetForm("Microfis_loanAccProductForm");
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
    this.autorun(() => {
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
    if ($disbursementDate && $disbursementDate.length > 0) {
        $disbursementDate.data("DateTimePicker").minDate(moment(productDoc.startDate).startOf('day'));
        $disbursementDate.data("DateTimePicker").maxDate(moment(productDoc.endDate).endOf('day'));

        // $disbursementDate.data("DateTimePicker").minDate(moment().startOf('day').toDate());
        // state.set('disbursmentDate', moment().startOf('day').toDate());

        // LoanAcc date change
        $disbursementDate.on("dp.change", function (e) {
            $firstRepaymentDate.data("DateTimePicker").minDate(moment(e.date).add(1, 'days').startOf('day').toDate());
            state.set('disbursmentDate', moment(e.date).startOf('day').toDate());

            if ($('[name="paymentMethod"]').val() == "D") {
                state.set("firstRepaymentDate", moment(e.date).add(1, 'days').toDate());
            } else if ($('[name="paymentMethod"]').val() == "W") {
                state.set("firstRepaymentDate", moment(e.date).add(1, 'weeks').toDate());

            } else if ($('[name="paymentMethod"]').val() == "M") {
                state.set("firstRepaymentDate", moment(e.date).add(1, 'months').toDate());

            } else if ($('[name="paymentMethod"]').val() == "Y") {
                state.set("firstRepaymentDate", moment(e.date).add(1, 'years').toDate());

            }

        });

        $submitDate.on("dp.change", function (e) {
            $disbursementDate.data("DateTimePicker").minDate(moment(e.date).startOf('day').toDate());
            state.set('disbursmentDate', moment(e.date).startOf('day').toDate());
        })
    }

    this.autorun(function () {
        if (productDoc.interestType == "A") {
            if (state.get("currencyId") == 'KHR') {
                state.set("defaultRate", roundKhr(productDoc.interestRate.defaultRate * productDoc.exchange.KHR));
            } else if (state.get("currencyId") == 'THB') {
                state.set("defaultRate", roundKhr(productDoc.interestRate.defaultRate * productDoc.exchange.KHR));
            }
        }

        Meteor.call('locationForAppend', true, (err, result) => {
            if (result) {
                $('[name="locationId"]').select2({data: result});
            }
        });
    })


});

formTmpl.helpers({
    dataHeader(){
        return Session.get('productDoc');
    },
    collection(){
        return LoanAcc;
    },
    data(){
        let doc = {}, formType = 'insert', formTypeStatus = true;
        let currentData = Template.currentData();

        if (currentData) {
            doc = LoanAcc.findOne({_id: currentData.loanAccId});
            doc.voucherId = doc.voucherId.substr(8, doc.voucherId.length - 1);
            formType = 'update';
            formTypeStatus = false;

            if (doc.escapeDayMethod == "NO") {
                stateClient.set('escapeFrequency', false);
            }
        }

        return {doc, formType, formTypeStatus};
    },
    cycle(){
        let currentData = Template.currentData();
        if (!currentData) {
            return stateClient.get('cycle') + 1;
        }
    },
    isEscapeDay(){
        return stateClient.get('escapeFrequency');
    },
    saving(){
        return state.get("saving");
    },
    disbursmentDate(){
        let currentData = Template.currentData();
        if (!currentData) {
            return state.get("disbursmentDate");
        }
    },
    firstRepaymentDate(){
        let currentData = Template.currentData();
        if (!currentData) {
            return state.get("firstRepaymentDate");
        }
    },
    currencyId(){
        if (state.get("currencyId")) {
            return state.get("currencyId");
        }
    },
    defaultRate(){

        return state.get("defaultRate");
    }


});

formTmpl.events({
    'change [name="escapeDayMethod"]'(e, t){
        if (e.currentTarget.value != "NO") {
            stateClient.set('escapeFrequency', true);
        } else {
            stateClient.set('escapeFrequency', false);
        }
    },
    'change [name="savingAccId"]'(e, t){
        state.set("currencyId", $('[name="savingAccId"] option:selected').text().split(" : ")[2]);
    },
    'click [name="submitDate"]'(e, t){
        let $submitDate = $('[name="submitDate"]');
        Meteor.call('microfis_getLastEndOfProcess', Session.get("currentBranch"), function (err, obj) {
            if (obj) {
                $submitDate.data("DateTimePicker").minDate(moment(obj.closeDate).startOf('day').toDate());
            }
        })
    },
    'click [name="disbursementDate"]'(e, t){
        let $disbursementDate = $('[name="disbursementDate"]');
        let $submitDate = $('[name="submitDate"]').val();

        if ($submitDate) {
            $disbursementDate.data("DateTimePicker").minDate(moment($submitDate, "DD/MM/YYYY").startOf('day').toDate());
        }
    }
    ,
    'keyup [name="interestRate"]': _.debounce(function (e) {
        let product = Session.get('productDoc');
        let val = $(e.currentTarget);
        if (state.get("currencyId") == "KHR") {
            product.interestRate.min = product.interestRate.min * product.exchange.KHR;
            product.interestRate.max = product.interestRate.max * product.exchange.KHR;
        } else if (state.get("currencyId") == "THB") {
            product.interestRate.min = product.interestRate.min * product.exchange.THB;
            product.interestRate.max = product.interestRate.max * product.exchange.THB;
        }
        if (val.val() < product.interestRate.min || val.val() > product.interestRate.max) {
            alertify.warning('Value not in Rank');
            val.val('');
            return;
        }
    }, 1500)

});

formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_loanAccForm");
    state.set("disbursmentDate", null);
    state.set("currencyId", null);
});


formTmpl.events({
    'click .js-saving-addon': function (e, t) {
        stateSavingAddOn.set("isAddmoreSaving", false);
        alertify.savingAccProduct(fa("plus", "Saving"), renderTemplate(savingAddOnTpl));
    }
});


// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            debugger;
            if(purchaseId.get()){
                 doc.purchaseId=purchaseId.get();
            }
            doc.disbursementDate = moment(doc.disbursementDate).startOf("day").add(12, "hours").toDate();
            doc.firstRepaymentDate = moment(doc.firstRepaymentDate).startOf("day").add(12, "hours").toDate();
            return doc;
        }
    },

    onSuccess (formType, result) {
        if (formType == "insert" && result.status != "Restructure") {
            stateClient.set("cycle", stateClient.get('cycle') + 1);
        }
        alertify.saleForm().close();
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