import {Template} from 'meteor/templating';
import {Tracker} from 'meteor/tracker';
import {ReactiveDict} from 'meteor/reactive-dict';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {_} from 'meteor/erasaur:meteor-lodash';
import BigNumber from 'bignumber.js';
import {round2} from 'meteor/theara:round2';
import math from 'mathjs';

// Lib
import {createNewAlertify} from '../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../core/common/libs/tapi18n-callback-helper.js';
import {roundCurrency} from '../../common/libs/round-currency.js';

// Component
import '../../../core/client/components/loading.js';
import '../../../core/client/components/column-action.js';
import '../../../core/client/components/form-footer.js';

// API Lib
import {MakeRepayment} from '../../common/libs/make-repayment.js';
import {Calculate} from '../../common/libs/calculate.js';

// Method
import {checkWriteOff} from '../../common/methods/check-writeOff.js';
import {makeWriteOffEnsure} from '../../common/methods/make-writeOffEnsure.js';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';


// Collection
import {Repayment} from '../../common/collections/repayment.js';

// Page
import './repayment-writeOff.html';

// Declare template
let formTmpl = Template.Microfis_repaymentWriteOffForm;


//-------- General Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = stateRepayment.get("loanAccDoc");

    // Set min/max amount to simple schema
    let minMaxAmount;
    switch (loanAccDoc.currencyId) {
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
    Session.set('maxAmountPaid', minMaxAmount);

    // Track autorun
    this.autorun(function () {
        let repaidDate = stateRepayment.get('repaidDate');

        if (repaidDate) {
            $.blockUI();

            if (loanAccDoc) {
                lookupLoanAcc.callPromise({
                    _id: loanAccDoc._id
                }).then(function (result) {
                    stateRepayment.set('loanAccDoc', result);
                }).catch(function (err) {
                    console.log(err.message);
                });
            }

            // Call check repayment from method
            checkWriteOff.callPromise({
                loanAccId: loanAccDoc._id,
                checkDate: repaidDate
            }).then(function (result) {
                // Set state
                stateRepayment.set('checkWriteOff', result);

                let maxAmountPaid = new BigNumber(0);
                if (result) {
                    Session.set('maxAmountPaid', maxAmountPaid.plus(result.writeOff.total + 1));
                }

                Meteor.setTimeout(()=> {
                    $.unblockUI();
                }, 200);
            }).catch(function (err) {
                console.log(err.message);
            });

        } else {
            stateRepayment.set('checkWriteOff', null);
        }
    });

});

formTmpl.onRendered(function () {
    let $repaidDateObj = $('[name="repaidDate"]');
    let repaidDate = moment($repaidDateObj.data("DateTimePicker").date()).toDate();

    stateRepayment.set('repaidDate', repaidDate);

    // Repaid date picker
    $repaidDateObj.on("dp.change", function (e) {
        stateRepayment.set('repaidDate', moment(e.date).toDate());
    });
});

formTmpl.helpers({
    collection(){
        return Repayment;
    },
    checkWriteOff(){
        let writeOffDoc = stateRepayment.get('checkWriteOff');

        if (writeOffDoc && writeOffDoc.outStanding == undefined) {
            writeOffDoc.outStanding.amount = 0;
            writeOffDoc.outStanding.interest = 0;
            writeOffDoc.outStanding.total = 0;

            writeOffDoc.paid.amount = 0;
            writeOffDoc.paid.interest = 0;
            writeOffDoc.paid.total = 0;

            writeOffDoc.writeOff.amount = 0;
            writeOffDoc.writeOff.interest = 0;
            writeOffDoc.writeOff.total = 0;

        }
        return writeOffDoc;
    },
    totalDue(){
        debugger;
        let totalDue = new BigNumber(0),
            checkWriteOff = stateRepayment.get('checkWriteOff');
        if (checkWriteOff && checkWriteOff.outStanding != undefined) {
            totalDue = totalDue.plus(checkWriteOff.outStanding.total);
        }
        return totalDue.toNumber();
    }
});

formTmpl.onDestroyed(function () {
    Session.set('minAmountPaid', null);
    Session.set('maxAmountPaid', null);
    Session.set('maxPenaltyPaid', null);

    AutoForm.resetForm("Microfis_repaymentWriteOffForm");

});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {


            let writeOffDoc = stateRepayment.get('checkWriteOff');
            let loanAccDoc = stateRepayment.get('loanAccDoc');

            if (loanAccDoc.status == "Restructure") {
                alertify.warning("You already Restructure!!!");
                return false;
            }

            if (loanAccDoc.status == "Close") {
                alertify.warning("You already Close");
                return false;
            }
            
            doc.penaltyPaid = 0;
            let makeRepaymentWriteOff = MakeRepayment.writeOff({
                repaidDate: doc.repaidDate,
                amountPaid: doc.amountPaid,
                loanAccDoc: loanAccDoc,
                opts: writeOffDoc
            });

            let repaymentWriteOffObj = {};
            repaymentWriteOffObj.paymentWriteOff = makeRepaymentWriteOff;

            if (makeRepaymentWriteOff.length > 0) {
                makeWriteOffEnsure.callPromise({
                    loanAccId: loanAccDoc._id,
                    opts: repaymentWriteOffObj
                }).then(function (result) {

                    if (result) {

                        lookupLoanAcc.callPromise({
                            _id: loanAccDoc._id
                        }).then(function (result) {
                            stateRepayment.set('loanAccDoc', result);
                        }).catch(function (err) {
                            console.log(err.message);
                        });
                    }

                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                return false;
            }
            doc.totalPaid = doc.amountPaid;
            doc.type = 'Write Off';
            this.result(doc);
        }
    },
    onSuccess (formType, result) {
        alertify.repayment().close();
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Microfis_repaymentWriteOffForm'], hooksObject);
