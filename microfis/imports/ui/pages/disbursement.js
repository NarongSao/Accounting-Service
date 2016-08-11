import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import fx from 'money';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';


// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';
import '../../../../core/client/components/add-new-button.js';

// Collection
import {Client} from '../../api/collections/client.js';
import {Disbursement} from '../../api/collections/disbursement.js';

// Method
import {lookupProduct} from '../../../common/methods/lookup-product.js';
import {lookupDisbursement} from '../../../common/methods/lookup-disbursement.js';

// Tabular
import {DisbursementTabular} from '../../../common/tabulars/disbursement.js';

// Page
import './disbursement.html';

// Declare template
let indexTmpl = Template.Microfis_disbursement,
    actionTmpl = Template.Microfis_disbursementAction,
    productFormTmpl = Template.Microfis_disbursementProductForm,
    formTmpl = Template.Microfis_disbursementForm,
    showTmpl = Template.Microfis_disbursementShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('disbursementProduct');
    createNewAlertify('disbursement', {size: 'lg'});
    createNewAlertify('disbursementShow');
});

indexTmpl.helpers({
    data(){
        let clientId = FlowRouter.getParam('clientId');
        let data = Client.findOne(clientId);
        data.photoUrl = null;
        if (data.photo) {
            let photo = Files.findOne(data.photo);
            data.photoUrl = photo.url();
        }

        return data;
    },
    tabularTable(){
        return DisbursementTabular;
    },
    tabularSelector(){
        return {clientId: FlowRouter.getParam('clientId')};
    },
});

indexTmpl.events({
    'click .js-create-microfis' (event, instance) {
        alertify.disbursementProduct(fa('plus', 'Disbursement Product'), renderTemplate(productFormTmpl));
    },
    'click .js-update' (event, instance) {
        // $.blockUI();

        let self = this;
        lookupProduct.callPromise({
            _id: self.productId
        }).then(function (result) {
            Session.set('productDoc', result);

            // Meteor.setTimeout(function () {
            alertify.disbursement(fa('pencil', 'Disbursement'), renderTemplate(formTmpl, {disbursementId: self._id})).maximize();

            // $.unblockUI();
            // }, 100);

        }).catch(function (err) {
            console.log(err.message);
        });

    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Disbursement,
            {_id: this._id},
            {title: 'Disbursement', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.disbursementShow(fa('eye', 'Disbursement'), renderTemplate(showTmpl, this));
    },
    'dblclick tbody > tr': function (event) {
        var dataTable = $(event.target).closest('table').DataTable();
        var rowData = dataTable.row(event.currentTarget).data();

        let params = {
            clientId: FlowRouter.getParam('clientId'),
            disbursementId: rowData._id
        };
        FlowRouter.go('microfis.repayment', params);
    }
});

// Product Form
productFormTmpl.helpers({
    productSchema(){
        return Disbursement.productSchema;
    },
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
        alertify.disbursementProduct().close();
    }
});

productFormTmpl.onDestroyed(function () {
    Session.set('productDoc', null);
});

AutoForm.hooks({
    Microfis_disbursementProductForm: {
        onSubmit: function (insertDoc, updateDoc, currentDoc) {
            this.event.preventDefault();
            this.done();
        },
        onSuccess: function (formType, result) {
            alertify.disbursement(fa('plus', 'Disbursement'), renderTemplate(formTmpl)).maximize();
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
            this.subscribe('microfis.disbursementById', currentData.disbursementId);
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

    // Disbursement date change
    $disbursementDate.on("dp.change", function (e) {
        console.log('hi date change');
        $submitDate.data("DateTimePicker").maxDate(moment(e.date).startOf('day'));
        $firstRepaymentDate.data("DateTimePicker").minDate(moment(e.date).add(1, 'days').startOf('day'));
    });
});

formTmpl.helpers({
    dataHeader(){
        return Session.get('productDoc');
    },
    collection(){
        return Disbursement;
    },
    data(){
        let doc = {}, formType = 'insert';
        let currentData = Template.currentData();

        if (currentData) {
            doc = Disbursement.findOne({_id: currentData.disbursementId});
            formType = 'update';
        }

        return {doc, formType};
    },
});

formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_disbursementForm");
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        alertify.disbursement().close();
        alertify.disbursementProduct().close();
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_disbursementForm'
], hooksObject);

// Show
showTmpl.onCreated(function () {
    let self = this;
    self.dataLookup = new ReactiveVar(false);

    self.autorun(function () {
        let currentData = Template.currentData();

        lookupDisbursement.callPromise({
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
