import {Template} from 'meteor/templating';
import {Tracker} from 'meteor/tracker';
import {ReactiveDict} from 'meteor/reactive-dict';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {_} from 'meteor/erasaur:meteor-lodash';

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

// Method
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';
import {lookupProduct} from '../../common/methods/lookup-product.js';

import {removeWriteOffEnsure} from '../../common/methods/remove-writeOffEnsure.js';
import {updateLoanAccPaymentWrteOff} from '../../common/methods/update-LoanAccPaymentWriteOff.js';
import {getLastRepayment} from '../../common/methods/get-last-repayment.js';

// API Lib
import {MakeRepayment} from '../../common/libs/make-repayment.js';

//Method
import {checkRepayment} from '../../common/methods/check-repayment';

// Collection
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

// Tabular
import {RepaymentTabular} from '../../common/tabulars/repayment.js';
import {LoanAccRestructureTabular} from '../../common/tabulars/loan-acc-restructure.js';
import {SavingTransactionTabular} from '../../common/tabulars/saving-transaction.js';


// Page
import './repaymentQuickForm.html';
import './repayment'
import './repayment-general.js';
import './repayment-fee.js';
import './repayment-prepay';
import './repayment-closing';
import './repayment-reschedule';
import './repayment-writeOff';

import './write-off-ensure.js';

// Declare template
let indexTmpl = Template.Microfis_repaymentQuickForm;

let clientAccOpt = new ReactiveVar([]);
let paymentTypeOpt = new ReactiveVar([]);
loanId = new ReactiveVar();
let defaultPaymentType = new ReactiveVar();
let isChange = new ReactiveVar();

let formPayment = new ReactiveDict();


indexTmpl.onCreated(function () {
    createNewAlertify('repayment', {size: 'lg'});
    createNewAlertify('writeOff');
    createNewAlertify('fee');
    createNewAlertify('repaymentShow');

    stateRepayment.set('checkRepayment', null);
    stateRepayment.set('loanAccDoc', null);

    this.autorun(function () {
        if (Session.get("resetQuickPayment") == true) {
            $("[name='clientAccId']").trigger("change").val("");
            $("[name='paymentType']").trigger("change").val("");
            Session.set("resetQuickPayment", false);
        }

        Meteor.call("microfis_clientAccOpt", Session.get("currentBranch"), function (err, result) {
            if (result) {
                clientAccOpt.set(result);
            }
        })
    })
    loanId.set(null);


    // Default state
    stateRepayment.setDefault({
        loanAccDoc: null,
        scheduleDoc: null,
        lastTransactionDate: null,
        repaidDate: moment().toDate(),
        checkRepayment: null,
        disbursmentDate: null,
        isVoucherId: false
    });

    this.autorun(function () {

        let loanAccId = loanId.get();
        let payDate = stateRepayment.get('repaidDate');
        let minMaxAmount = 0.01;


        if (loanAccId && payDate) {
            $.blockUI.defaults.overlayCSS = {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'};
            $.blockUI({
                overlayCSS: {
                    backgroundColor: '#fff',
                    opacity: 0.1,
                    cursor: 'wait'
                }
            });
            let startDate = moment(payDate).startOf("year").toDate();

            // Get loan account doc
            lookupLoanAcc.callPromise({
                _id: loanAccId
            }).then(function (result) {
                stateRepayment.set('loanAccDoc', result);
                stateRepayment.set('lastTransactionDate', result.disbursementDate);
                stateRepayment.set("feeAmount", result.feeAmount);
                stateRepayment.set("isChargFee", result.totalFeeOnDisburment);

                if (isChange.get() == true) {
                    paymentTypeOpt.set([]);
                    let paymentType = [
                        {label: '(Select One)', value: ''},
                        {label: 'General', value: 'General'},
                        {label: 'Prepay', value: 'Prepay'},
                        {label: 'Closing', value: 'Closing'},
                        {label: 'ReSchedule', value: 'ReSchedule'},
                        {label: 'WriteOff', value: 'WriteOff'}
                    ];

                    if (result.feeAmount == 0) {
                        paymentTypeOpt.set([
                            {label: '(Select One)', value: ''},
                            {label: 'Fee', value: 'Fee'}
                        ]);
                    } else {
                        paymentTypeOpt.set(paymentType);
                    }
                    isChange.set(false);
                }


                switch (result.currencyId) {
                    case 'KHR':
                        minMaxAmount = 100;
                        break;
                    case 'USD':
                        minMaxAmount = 0.01;
                        break;
                    case 'THB':
                        minMaxAmount = 1;
                        break;
                }
                Session.set('minAmountPaid', minMaxAmount);
                // Session.set('maxAmountPaid', minMaxAmount);
                Session.set('maxPenaltyPaid', minMaxAmount);


                Meteor.call('microfis_getLastVoucher', result.currencyId, startDate, Session.get("currentBranch"), function (err, result) {
                    if (result != undefined) {
                        stateRepayment.set('lastVoucherId', parseInt((result.voucherId).substr(8, 13)) + 1);
                    } else {
                        stateRepayment.set('lastVoucherId', "000001");
                    }
                });


                Meteor.setTimeout(() => {
                    $.unblockUI();
                }, 200);
            }).catch(function (err) {
                console.log(err.message);
            });


            // Call check repayment from method
            checkRepayment.callPromise({
                loanAccId: loanAccId,
                checkDate: payDate
            }).then(function (result) {
                // Set state
                stateRepayment.set('checkRepayment', result);
                // stateRepayment.set('lastTransactionDate', result.lastRepayment.repaidDate);


                if (result.lastRepayment) {
                    Meteor.call("microfis_getLastEndOfProcess", Session.get('currentBranch'), loanAccId, function (err, endDoc) {
                        if (endDoc) {
                            if (moment(endDoc.closeDate).toDate().getTime() > moment(result.lastRepayment.repaidDate).toDate().getTime()) {
                                stateRepayment.set('lastTransactionDate', moment(endDoc.closeDate).startOf('day').add(1, "days").toDate());
                            } else {
                                stateRepayment.set('lastTransactionDate', moment(result.lastRepayment.repaidDate).startOf("days").toDate());
                            }
                        } else {
                            stateRepayment.set('lastTransactionDate', moment(result.lastRepayment.repaidDate).startOf("days").toDate());
                        }
                    })
                }

                Meteor.setTimeout(() => {
                    $.unblockUI();
                }, 200);

            }).catch(function (err) {
                console.log(err.message);
            });
            $.unblockUI();
        }
    });


})


indexTmpl.helpers({
    loanAccDoc(){
        return stateRepayment.get('loanAccDoc');
    },
    checkPayment(){
        return stateRepayment.get('checkRepayment');
    },
    schema(){
        return Repayment.QuickPay;
    },
    clientAccOpt(){
        return clientAccOpt.get();
    },
    paymentTypeOpt(){
        return paymentTypeOpt.get();
    },
    isGeneral(){
        return formPayment.get("isGeneral");
    },
    isFee(){
        return formPayment.get("isFee");

    },
    isPrepay(){
        return formPayment.get("isPrepay");

    },
    isReschedule(){
        return formPayment.get("isReschedule");

    },
    isWriteOff(){
        return formPayment.get("isWriteOff");

    },
    isClose(){
        return formPayment.get("isClose");
    }
})

indexTmpl.events({
    'change [name="clientAccId"]'(e, t){
        loanId.set(e.currentTarget.value);
        isChange.set(true);
        clearFormPayment();
    },
    'change [name="paymentType"]'(e, t){

        clearFormPayment();

        if (e.currentTarget.value == "General") {
            formPayment.set("isGeneral", true);
        } else if (e.currentTarget.value == "Fee") {
            formPayment.set("isFee", true);
        } else if (e.currentTarget.value == "Prepay") {
            formPayment.set("isPrepay", true);
        } else if (e.currentTarget.value == "ReSchedule") {
            formPayment.set("isReschedule", true);
        } else if (e.currentTarget.value == "WriteOff") {
            formPayment.set("isWriteOff", true);
        } else if (e.currentTarget.value == "Closing") {
            formPayment.set("isClose", true);
        }
    }
})


indexTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_repaymentQuickForm");
});

let clearFormPayment = function () {
    formPayment.set("isGeneral", false);
    formPayment.set("isFee", false);
    formPayment.set("isPrepay", false);
    formPayment.set("isReschedule", false);
    formPayment.set("isWriteOff", false);
    formPayment.set("isClose", false);


}

// use a different message
// $.blockUI({
//     overlayCSS: {
//         backgroundColor: '#fff',
//         opacity: 0.1,
//         cursor: 'wait'
//     },
// });