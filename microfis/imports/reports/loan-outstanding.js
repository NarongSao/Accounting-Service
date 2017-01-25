import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {AutoForm} from 'meteor/aldeed:autoform';
import moment from 'moment';
import 'meteor/theara:autoprint';
import 'printthis';

// Lib
import {displaySuccess, displayError} from '../../../core/client/libs/display-alert.js';
import {createNewAlertify} from '../../../core/client/libs/create-new-alertify';
import {renderTemplate} from '../../../core/client/libs/render-template';
// Component
import '../../../core/imports/layouts/report/content.html';
import '../../../core/imports/layouts/report/sign-footer.html';
import '../../../core/client/components/loading.js';
import '../../../core/client/components/form-footer.js';

// Method
import {loanOutstandingReport} from '../../common/methods/reports/loan-outstanding.js';
import {SelectOptMethods} from '../../common/methods/select-opts.js';

// Schema
import {LoanOutstandingSchema} from '../../common/collections/reports/loan-outstanding.js';

// Page
import './loan-outstanding.html';

// Declare template
let indexTmpl = Template.Microfis_loanOutstandingReport,
    tmplPrintData = Template.Microfis_loanOutstandingReportPrintData;
// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);
indexTmpl.onCreated(function () {
    createNewAlertify('Microfis_loanOutstandingReport');
    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            loanOutstandingReport.callPromise({params: params})
                .then((result) => {
                    rptDataState.set(result);
                }).catch((err) => {
                    console.log(err.message);
                }
            );
        }

    });

    this.locationOpt = new ReactiveVar();
    Meteor.call('locationForReport', (err, result) => {
        this.locationOpt.set(result);
    });

});
tmplPrintData.helpers({
    rptInit(){
        return rptInitState.get();
    },
    rptData: function () {
        return rptDataState.get();
    }
});

indexTmpl.helpers({
    schema(){
        return LoanOutstandingSchema;
    },
    khNameForPaymentMethod(paymentMethod){
        let khName;
        switch (paymentMethod) {
            case 'D':
                khName = 'ថ្ងៃ';
                break;
            case 'W':
                khName = 'សប្តាហ៍';
                break;
            case 'M':
                khName = 'ខែ';
                break;
            case 'Y':
                khName = 'ឆ្នាំ';
                break
        }

        return khName;
    },
    khDayForDueDate(dueDate){
        let khName;
        let isoWeekday = moment(dueDate).isoWeekday();

        switch (isoWeekday) {
            case 1:
                khName = 'ចន្ទ';
                break;
            case 2:
                khName = 'អង្គារ៍';
                break;
            case 3:
                khName = 'ពុធ';
                break;
            case 4:
                khName = 'ព្រហស្បត្តិ៍';
                break;
            case 5:
                khName = 'សុក្រ';
                break;
            case 6:
                khName = 'សៅរ៍';
                break;
            case 7:
                khName = 'អាទិត្យ';
                break;
        }

        return khName;
    },
    locationOpt(){
        let instance = Template.instance();
        if (instance.locationOpt.get()) {
            return instance.locationOpt.get();
        }
        return [];
    }
});

indexTmpl.events({
    'click .fullScreen'(event, instance){
        alertify.Microfis_loanOutstandingReport(fa('', ''), renderTemplate(tmplPrintData)).maximize();
    },
    'click .btn-print'(event, instance){

        $('#print-data').printThis();

    }
});

tmplPrintData.onDestroyed(function () {


});
indexTmpl.onDestroyed(function () {
    formDataState.set(null);
    rptDataState.set(null);
    rptInitState.set(false);
});

// hook
let hooksObject = {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
        this.event.preventDefault();
        formDataState.set(null);

        this.done(null, insertDoc);
    },
    onSuccess: function (formType, result) {
        formDataState.set(result);

        $('[name="branchId"]').val(result.branchId);
        $('[name="creditOfficerId"]').val(result.creditOfficerId);
        $('[name="paymentMethod"]').val(result.paymentMethod);
        $('[name="currencyId"]').val(result.currencyId);
        $('[name="productId"]').val(result.productId);
        $('[name="locationId"]').val(result.locationId);
        $('[name="fundId"]').val(result.fundId);
        $('[name="classifyId"]').val(result.classifyId);

        $('[name="date"]').val(moment(result.date).format("DD/MM/YYYY"));
        $('[name="exchangeId"]').val(result.exchangeId);
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks('Microfis_loanOutstandingReport', hooksObject);
