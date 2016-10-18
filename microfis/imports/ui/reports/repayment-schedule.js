import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {AutoForm} from 'meteor/aldeed:autoform';
import moment from 'moment';
import 'meteor/theara:autoprint';
import 'printthis';

// Lib
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';

// Component
import '../../../../core/imports/ui/layouts/report/content.html';
import '../../../../core/imports/ui/layouts/report/sign-footer.html';
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/form-footer.js';

// Method
import {repaymentScheduleReport} from '../../../common/methods/reports/repayment-schedule.js';

// Schema
import {RepaymentScheduleSchema} from '../../api/collections/reports/repayment-schedule.js';

// Page
import './repayment-schedule.html';

// Declare template
let indexTmpl = Template.Microfis_repaymentScheduleReport;

// Form state
let formDataState = new ReactiveVar(null);

// Index
indexTmpl.onCreated(function () {
    this.rptInitState = new ReactiveVar(false);
    this.rptDataState = new ReactiveVar(null);

    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            this.rptInitState.set(true);
            this.rptDataState.set(null);

            let params = {
                loanAccId: formDataState.get().loanAccId
            };

            repaymentScheduleReport.callPromise(params)
                .then((result)=> {
                    this.rptDataState.set(result);
                }).catch((err)=> {
                    console.log(err.message);
                }
            );
        }
    });
});

indexTmpl.helpers({
    schema(){
        return RepaymentScheduleSchema;
    },
    rptInit(){
        let instance = Template.instance();
        return instance.rptInitState.get();
    },
    rptData: function () {
        let instance = Template.instance();
        return instance.rptDataState.get();
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
    }
});

indexTmpl.events({
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


        $('#print-data').printThis();
    }
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
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks('Microfis_repaymentScheduleReport', hooksObject);
