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

import {LoanAcc} from '../../common/collections/loan-acc.js';

// Method

import {makeReSchedule} from '../../common/methods/make-reSchedule.js';
import {checkRepayment} from '../../common/methods/check-repayment';
import {lookupProduct} from '../../common/methods/lookup-product.js';

// Page
import './reStructure.html';

// Declare template
let formTmpl = Template.Microfis_reStructure;

let state = new ReactiveDict();


// Form
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = currentData.loanAccDoc;

    // Set state
    state.setDefault({
        loanAccDoc: loanAccDoc,
        lastTransactionDate: loanAccDoc.disbursementDate,
        disbursmentDate: moment().toDate(),
        checkRepayment: null
    });

    this.autorun(() => {

        let disbursementDate = state.get('disbursmentDate');


        if (loanAccDoc.productId) {
            $.blockUI();

            lookupProduct.callPromise({
                _id: loanAccDoc.productId
            }).then(function (result) {
                Session.set('productDoc', result);

                Meteor.setTimeout(function () {
                    $.unblockUI();
                }, 100);

            }).catch(function (err) {
                console.log(err.message);
            });
        }

        if (disbursementDate) {
            $.blockUI();

            let currentData = Template.currentData();
            state.set('curData', currentData);

            if (currentData) {
                state.set('lastTransactionDate', currentData.disbursementDate);
                this.subscribe('microfis.loanAccById', loanAccDoc._id);
            }


            // Call check repayment from method
            checkRepayment.callPromise({
                loanAccId: loanAccDoc._id,
                checkDate: disbursementDate
            }).then(function (result) {
                // Set state
                state.set('checkRepayment', result);
                state.set('balanceUnPaid', result.balanceUnPaid);
                // Set last repayment
                if (result.lastRepayment) {
                    state.set('lastTransactionDate', result.lastRepayment.repaidDate);
                }


                Meteor.setTimeout(() => {
                    $.unblockUI();
                }, 200);

            }).catch(function (err) {
                console.log(err.message);
            });

        } else {
            state.set('checkRepayment', null);
        }

    });
});

formTmpl.onRendered(function () {

    Meteor.setTimeout(function () {
        let $disbursementDate = $('[name="disbursementDate"]');
        let $firstRepaymentDate = $('[name="firstRepaymentDate"]');
        let productDoc = Session.get('productDoc');

        $disbursementDate.data("DateTimePicker").minDate(moment(productDoc.startDate).startOf('day'));
        $disbursementDate.data("DateTimePicker").maxDate(moment(productDoc.endDate).endOf('day'));

        $firstRepaymentDate.data("DateTimePicker").minDate(moment().add(1, 'days').startOf('day'));

        // LoanAcc date change
        $disbursementDate.on("dp.change", function (e) {
            debugger;
            state.set('disbursmentDate', moment(e.date).toDate());
            $firstRepaymentDate.data("DateTimePicker").minDate(moment(e.date).add(1, 'days').startOf('day'));
        });

    }, 100);
});

formTmpl.helpers({

    schema() {
        return LoanAcc.reStructure;
    },
    balanceUnPaid() {
        return state.get('balanceUnPaid');
    }

});


formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_reStructure");
    state.set('curData', undefined);
});

// Hook
let hooksObject = {
    onSubmit(doc) {

        let curDoc = state.get('curData');

        if (curDoc.loanAccDoc.status == "ReStructure") {
            alertify.error("You already Restructure");
            return false;
        }


        if (curDoc.loanAccDoc.disbursementDate > doc.disbursementDate) {
            alertify.error("Less than disbursement date");
            return false;
        }


        makeReSchedule.callPromise({
            loanAccId: curDoc.loanAccDoc._id,
            opts: doc
        }).then(function (result) {
            if (result) {
                alertify.repayment().close();
            }
        }).catch(function (err) {
            alertify.error(err.message);
        });
        return false;
    }

};

AutoForm.addHooks([
    'Microfis_reStructure'
], hooksObject);
