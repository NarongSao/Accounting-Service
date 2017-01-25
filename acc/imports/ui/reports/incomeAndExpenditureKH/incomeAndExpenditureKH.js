import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {AutoForm} from 'meteor/aldeed:autoform';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import 'meteor/theara:autoprint';
import {DateTimePicker} from 'meteor/tsega:bootstrap3-datetimepicker';


// Component
import '../../../../../core/imports/layouts/report/content.html';
import '../../../../../core/imports/layouts/report/sign-footer.html';
import '../../../../../core/client/components/loading.js';
import '../../../../../core/client/components/form-footer.js';

//Lib
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {__} from '../../../../../core/common/libs/tapi18n-callback-helper.js';

// Method
// import '../../../../common/methods/reports/incomeAndExpenditureKH';
import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {IncomeAndExpenditureKh} from '../../../../imports/api/collections/reports/incomeAndExpenditureKH';

// Page
import './incomeAndExpenditureKH.html';
// Declare template

var reportTpl = Template.acc_IncomeAndExpenditureKh,
    generateTpl = Template.acc_IncomeAndExpenditureKhReportGen,
    tmplPrintData=Template.acc_IncomeAndExpenditureKhPrintReportGen;


reportTpl.helpers({
    schema() {
        return IncomeAndExpenditureKh;
    }
})
//===================================Run

// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);


reportTpl.onCreated(function () {
    createNewAlertify('acc_IncomeAndExpenditureKh');
    this.autorun(() => {

        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            Meteor.call('acc_IncomeAndExpenditureKh', params, function (err, result) {
                if (result) {
                    rptDataState.set(result);
                } else {
                    console.log(err.message);
                }
            })


        }

    });
});


tmplPrintData.helpers({
    rptInit(){
        if (rptInitState.get() == true) {
            return rptInitState.get();
        }
    },
    rptData: function () {
        return rptDataState.get();
    }
});


reportTpl.events({
    'click .run ': function (e, t) {
        let result = {};
        result.branchId = $('[name="branchId"]').val();
        result.date = t.$('[name="date"]').val();
        result.exchangeDate= $('[name="exchangeDate"]').val();

        if(result.exchangeDate==""){
            alertify.warning("Exchange is Required!!!");
            return false;
        }

        formDataState.set(result);
    },
    'click .fullScreen'(event, instance){


        alertify.acc_IncomeAndExpenditureKh(fa('', ''), renderTemplate(tmplPrintData)).maximize();
    },
    'click .btn-print'(event, instance){



        $('#print-data').printThis();
    }
});



reportTpl.onDestroyed(function () {
    formDataState.set(null);
    rptDataState.set(null);
    rptInitState.set(false);
});


// hook
let hooksObject = {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
        debugger;
        this.event.preventDefault();
        formDataState.set(null);

        this.done(null, insertDoc);

    },
    onSuccess: function (formType, result) {
        formDataState.set(result);

        // $('[name="branchId"]').val(result.branchId);
        // $('[name="creditOfficerId"]').val(result.creditOfficerId);
        // $('[name="paymentMethod"]').val(result.paymentMethod);
        // $('[name="currencyId"]').val(result.currencyId);
        // $('[name="productId"]').val(result.productId);
        // $('[name="locationId"]').val(result.locationId);
        // $('[name="fundId"]').val(result.fundId);
        // $('[name="classifyId"]').val(result.classifyId);
        //
        // $('[name="date"]').val(moment(result.date).format("DD/MM/YYYY"));
        // $('[name="exchangeId"]').val(result.exchangeId);
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};



// ===============================Generate

generateTpl.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    }
    ,data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        Fetcher.setDefault('data',false);
        Fetcher.retrieve('data','acc_IncomeAndExpenditureKh',q);

        return Fetcher.get('data');

       /* var callId = JSON.stringify(q);
        var call = Meteor.callAsync(callId,'acc_IncomeAndExpenditure', q);

        if (!call.ready()) {
            return false;
        }
        return call.result();*/
    }
});
