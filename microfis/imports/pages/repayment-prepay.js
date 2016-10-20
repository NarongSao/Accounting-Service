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

// Method
import {checkRepayment} from '../../common/methods/check-repayment';

// API Lib
import {MakeRepayment} from '../../common/libs/make-repayment.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

// Page
import './repayment-prepay.html';

// Declare template
let formTmpl = Template.Microfis_repaymentPrepayForm;

// State
let state = new ReactiveDict();

//-------- Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = currentData.loanAccDoc;

    // Set state
    state.setDefault({
        loanAccDoc: loanAccDoc,
        lastTransactionDate: loanAccDoc.disbursementDate,
        repaidDate: null,
        checkRepayment: null
    });

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
    Session.set('maxPenaltyPaid', minMaxAmount);

    // Track autorun
    this.autorun(function () {
        let repaidDate = state.get('repaidDate');

        if (repaidDate) {
            $.blockUI();

            // Call check repayment from method
            checkRepayment.callPromise({
                loanAccId: loanAccDoc._id,
                checkDate: repaidDate
            }).then(function (result) {
                console.log(result);

                // Set state
                state.set('checkRepayment', result);

                // Set max amount on simple schema
                if (result && result.totalScheduleNext) {
                    let maxAmountPaid = result.totalScheduleNext.totalPrincipalInterestDue - Session.get('minAmountPaid');
                    Session.set('maxAmountPaid', maxAmountPaid);
                }

                // Set last repayment
                if (result.lastRepayment) {
                    state.set('lastTransactionDate', result.lastRepayment.repaidDate);
                }

                Meteor.setTimeout(()=> {
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
    let $repaidDateObj = $('[name="repaidDate"]');
    let repaidDate = moment($repaidDateObj.data("DateTimePicker").date()).toDate();

    state.set('repaidDate', repaidDate);

    // Repaid date picker
    $repaidDateObj.data("DateTimePicker").minDate(moment(state.get('lastTransactionDate')).startOf('day'));
    $repaidDateObj.on("dp.change", function (e) {
        state.set('repaidDate', moment(e.date).toDate());
    });
});

formTmpl.helpers({
    collection(){
        return Repayment;
    },
    checkRepayment(){
        return state.get('checkRepayment');
    },
    defaultValue(){
        // let totalDue = Session.get('maxAmountPaid'),
        let totalDue = 0,
            totalPenalty = 0,
            checkRepayment = state.get('checkRepayment');

        if (checkRepayment && checkRepayment.totalScheduleDue) {
            totalDue = checkRepayment.totalScheduleDue.totalPrincipalInterestDue;
            totalPenalty = checkRepayment.totalScheduleDue.penaltyDue;
        }

        return {totalDue, totalPenalty};
    },
    jsonViewData(data){
        if (data) {
            if (_.isArray(data) && data.length > 0) {
                _.forEach(data, (o, k)=> {
                    o.scheduleDate = moment(o.scheduleDate).format('DD/MM/YYY');
                    o.dueDate = moment(o.dueDate).format('DD/MM/YYY');
                    delete  o.repaymentDoc;
                    data[k] = o;
                })
            }

            return data;
        }
    },
    jsonViewOpts(){
        return {collapsed: true};
    }
});

formTmpl.onDestroyed(function () {
    Session.set('minAmountPaid', null);
    Session.set('maxAmountPaid', null);
    Session.set('maxPenaltyPaid', null);
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let loanAccDoc = state.get('loanAccDoc'),
                checkRepayment = state.get('checkRepayment');

            doc.type = 'prepay';

            // Check have current due amount
            if (checkRepayment && checkRepayment.scheduleDue.length > 0) {
                displayError("Have current due amount, so can't prepay");
                return false;
            }

            // Check to payment
            let checkBeforePayment = checkRepayment && checkRepayment.scheduleNext.length > 0 && doc.repaidDate && doc.amountPaid > 0;
            if (checkBeforePayment) {
                let makeRepayment = MakeRepayment.prepay({
                    repaidDate: doc.repaidDate,
                    amountPaid: doc.amountPaid,
                    scheduleNext: checkRepayment.scheduleNext
                });

                console.log(makeRepayment);

                doc.totalPaid = doc.amountPaid;

                doc.detailDoc = makeRepayment;
                doc.detailDoc.scheduleNext = checkRepayment.scheduleNext;
            }

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
AutoForm.addHooks(['Microfis_repaymentPrepayForm'], hooksObject);
