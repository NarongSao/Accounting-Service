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
import {loanClosingReport} from '../../common/methods/reports/loanClosing.js';
import {SelectOptMethods} from '../../common/methods/select-opts.js';

// Schema
import {LoanClosingSchema} from '../../common/collections/reports/loanClosing.js';

// Page
import './loanClosing.html';

// Declare template
let indexTmpl = Template.Microfis_loanClosingReport,
    tmplPrintData = Template.Microfis_loanClosingReportPrintData;
// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);
indexTmpl.onCreated(function () {
    createNewAlertify('Microfis_loanClosingReport');
    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            loanClosingReport.callPromise({params: params})
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
        return LoanClosingSchema;
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
        // $('.sub-div').addClass('rpt-9 rpt-landscape-a4');
        // $('.sub-table').addClass('rpt-9 rpt rpt-content');
        // $('.sub-body').addClass('rpt rpt-content-body');
        // $('.sub-header').addClass('rpt rpt-content-header');

        $('.sub-div').removeClass('rpt-9 rpt-landscape-a4');
        $('.sub-table').removeClass('rpt-9 rpt rpt-content');
        $('.sub-body').removeClass('rpt-content-body');
        $('.sub-header').removeClass('rpt-content-header');

        $('.sub-div').addClass('rpt rpt-3x');
        $('.sub-table').addClass('table table-hover');
        $('.sub-body').addClass('rpt rpt-3x ');
        $('.sub-header').addClass('rpt rpt-3x');

        alertify.Microfis_collectionSheetReport(fa('', ''), renderTemplate(tmplPrintData)).maximize();
    },
    'click .btn-print'(event, instance){
        let opts = {
            // debug: true,               // show the iframe for debugging
            // importCSS: true,            // import page CSS
            // importStyle: true,         // import style tags
            // printContainer: true,       // grab outer container as well as the contents of the selector
            // loadCSS: "path/to/my.css",  // path to additional css file - us an array [] for multiple
            // pageTitle: "",              // add title to print page
            // removeInline: false,        // remove all inline styles from print elements
            // printDelay: 333,            // variable print delay; depending on complexity a higher value may be necessary
            // header: null,               // prefix to html
            // formValues: true            // preserve input/form values
        };

        $('.sub-div').removeClass('rpt rpt-3x');
        $('.sub-table').removeClass('table table-hover');
        $('.sub-body').removeClass('rpt rpt-3x ');
        $('.sub-header').removeClass('rpt rpt-3x');

        $('.sub-div').addClass('rpt-9 rpt-landscape-a4');
        $('.sub-table').addClass('rpt-9 rpt rpt-content');
        $('.sub-body').addClass('rpt-content-body');
        $('.sub-header').addClass('rpt-content-header');


        Meteor.setTimeout(function () {
            $('#print-data').printThis();

            Meteor.setTimeout(function () {
                $('.sub-div').removeClass('rpt-9 rpt-landscape-a4');
                $('.sub-table').removeClass('rpt-9 rpt rpt-content');
                $('.sub-body').removeClass('rpt-content-body');
                $('.sub-header').removeClass('rpt-content-header');


                $('.sub-div').addClass('rpt rpt-3x');
                $('.sub-table').addClass('table table-hover');
                $('.sub-body').addClass('rpt rpt-3x');
                $('.sub-header').addClass('rpt rpt-3x');
            }, 2000);
        }, 200)
    },
    'click .panel-heading'(e, t){
        let $this = $('.clickable');
        if (!$this.hasClass('panel-collapsed')) {
            $this.parents('.panel').find('.panel-body').slideUp();
            $this.addClass('panel-collapsed');
            $this.find('i').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        } else {
            $this.parents('.panel').find('.panel-body').slideDown();
            $this.removeClass('panel-collapsed');
            $this.find('i').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        }
    }
});

tmplPrintData.onDestroyed(function () {
    // $('.sub-div').removeClass('rpt-9 rpt-landscape-a4');
    // $('.sub-table').removeClass('rpt-9 rpt rpt-content');
    // $('.sub-body').removeClass('rpt rpt-content-body');
    // $('.sub-header').removeClass('rpt rpt-content-header');

    $('.sub-div').removeClass('rpt-9 rpt-landscape-a4');
    $('.sub-table').removeClass('rpt-9 rpt rpt-content');
    $('.sub-body').removeClass('rpt-content-body');
    $('.sub-header').removeClass('rpt-content-header');


    $('.sub-div').addClass('rpt rpt-3x');
    $('.sub-table').addClass('table table-hover');
    $('.sub-body').addClass('rpt rpt-3x');
    $('.sub-header').addClass('rpt rpt-3x');

});
indexTmpl.onDestroyed(function () {
    formDataState.set(null);
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

AutoForm.addHooks('Microfis_loanClosingReport', hooksObject);
