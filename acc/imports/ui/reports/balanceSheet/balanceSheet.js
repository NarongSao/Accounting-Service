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

// Method
// import '../../../../common/methods/reports/balanceSheet.js';
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';


import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {BalanceSheetSchema} from '../../../../imports/api/collections/reports/balanceSheet.js';

// Page
import './balanceSheet.html';
// Declare template
var reportTpl = Template.acc_balanceSheetReport,
    generateTpl = Template.acc_balanceSheetReportGen,
    generateTplForAll = Template.acc_balanceSheetForAllReportGen,
    tmplPrintForAllData = Template.acc_balanceSheetForAllPrintData;

reportTpl.onRendered(function () {
    switcherFun();
})

reportTpl.helpers({
    schema() {
        return BalanceSheetSchema;
    }
})


//===================================Run

// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);


reportTpl.onCreated(function () {
    createNewAlertify('acc_balanceSheetForAllReport');
    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            Meteor.call('acc_BalanceSheetMulti', params, function (err, result) {
                if (result) {
                    rptDataState.set(result);
                } else {
                    console.log(err.message);
                }
            })


        }

    });
});


tmplPrintForAllData.helpers({
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
        debugger;

        let result = {};
        result.branchId = $('[name="branchId"]').val();
        result.date = $('[name="date"]').val();
        result.currencyId = $('[name="currencyId"]').val();
        result.exchangeDate = $('[name="exchangeDate"]').val();
        result.showNonActive = $('[name="showNonActive"]').is(":checked");

        if (result.exchangeDate == "") {
            alertify.warning("Exchange is Required!!!");
            return false;
        }

        formDataState.set(result);
    },
    'change [name="accountType"]': function (e) {
        Session.set('accountTypeIdSession', $(e.currentTarget).val());
    },
    'click .fullScreen'(event, instance){
        // $('.sub-div').addClass('rpt-9 rpt-landscape-a4');
        // $('.sub-table').addClass('rpt-9 rpt rpt-content');
        // $('.sub-body').addClass('rpt rpt-content-body');
        // $('.sub-header').addClass('rpt rpt-content-header');

        $('.sub-div').removeClass('rpt-9 rpt-portrait-a4');
        $('.sub-table').removeClass('rpt-9 rpt rpt-content');
        $('.sub-body').removeClass('rpt-content-body');
        $('.sub-header').removeClass('rpt-content-header');

        $('.sub-div').addClass('rpt rpt-3x');
        $('.sub-table').addClass('table table-hover');
        $('.sub-body').addClass('rpt rpt-3x ');
        $('.sub-header').addClass('rpt rpt-3x');

        alertify.acc_balanceSheetForAllReport(fa('', ''), renderTemplate(tmplPrintForAllData)).maximize();
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

        $('.sub-div').addClass('rpt rpt-9 rpt-portrait-a4');
        $('.sub-table').addClass('rpt-9 rpt rpt-content-mix');
        $('.sub-body').addClass('rpt-content-body');
        $('.sub-header').addClass('rpt-content-header');


        Meteor.setTimeout(function () {
            $('#print-data').printThis();

            Meteor.setTimeout(function () {
                $('.sub-div').removeClass('rpt rpt-9 rpt-portrait-a4');
                $('.sub-table').removeClass('rpt-9 rpt rpt-content-mix');
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

tmplPrintForAllData.onDestroyed(function () {
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


generateTplForAll.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    },
    dataMain: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        var callId = JSON.stringify(q);

        var call = Meteor.callAsync(callId, 'acc_BalanceSheetMulti', q);

        if (!call.ready()) {
            return false;
        }

        return call.result();


        /* Fetcher.setDefault('data', false);
         Fetcher.retrieve('data', 'acc_BalanceSheetMulti', q);

         return Fetcher.get('data');*/

    }
});

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
    },
    dataMain: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        /*Fetcher.setDefault('data',false);
         Fetcher.retrieve('data','acc_BalanceSheet',q);

         return Fetcher.get('data');*/


        var callId = JSON.stringify(q);

        var call = Meteor.callAsync(callId, 'acc_BalanceSheet', q);

        if (!call.ready()) {
            return false;
        }
        return call.result();
    }
});


var switcherFun = function () {
    var elem = document.querySelector('.js-switch');
    var init = new Switchery(elem, {
        color: '#3c8dbc',
        size: 'small'
    });
};






