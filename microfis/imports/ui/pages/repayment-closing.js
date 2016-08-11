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
import {Calculate} from '../../../common/methods/libs/calculate.js';
import math from 'mathjs';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {roundCurrency} from '../../api/libs/round-currency.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// API Lib
import {MakeRepayment} from '../../api/libs/make-repayment.js';

// Method
import {checkRepayment} from '../../../common/methods/check-repayment';

// Collection
import {Repayment} from '../../api/collections/repayment.js';

// Page
import './repayment-closing.html';

// Declare template
let formTmpl = Template.Microfis_repaymentClosingForm;

// State
let state = new ReactiveDict();

//-------- General Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        disbursementDoc = currentData.disbursementDoc;

    // Set state
    state.setDefault({
        disbursementDoc: disbursementDoc,
        lastTransactionDate: disbursementDoc.disbursementDate,
        repaidDate: null,
        checkRepayment: null
    });

    // Set min/max amount to simple schema
    let minMaxAmount;
    switch (disbursementDoc.currencyId) {
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
                disbursementId: disbursementDoc._id,
                checkDate: repaidDate
            }).then(function (result) {
                console.log(result);

                // Set state
                state.set('checkRepayment', result);

                // Set max amount on simple schema
                let maxAmountPaid = new BigNumber(0);
                if (result && result.totalScheduleDue) {
                    maxAmountPaid = maxAmountPaid.plus(result.totalScheduleDue.totalPrincipalInterestDue);
                    Session.set('maxPenaltyPaid', result.totalScheduleDue.penaltyDue);
                }
                if (result && result.closing) {
                    maxAmountPaid = maxAmountPaid.plus(result.closing.totalDue);
                }
                if (maxAmountPaid.greaterThan(0)) {
                    Session.set('maxAmountPaid', maxAmountPaid.toNumber());
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

    // Get last repayment
    let lastRepaid = Repayment.findOne({
        disbursementId: disbursementDoc._id
    }, {sort: {_id: -1}});
    if (lastRepaid) {
        state.set('lastTransactionDate', lastRepaid.repaidDate);
    }

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
        let totalDue = new BigNumber(0),
            totalPenalty = new BigNumber(0),
            checkRepayment = state.get('checkRepayment');

        if (checkRepayment && checkRepayment.totalScheduleDue) {
            totalDue = totalDue.plus(checkRepayment.totalScheduleDue.totalPrincipalInterestDue);
            totalPenalty = totalPenalty.plus(checkRepayment.totalScheduleDue.penaltyDue);
        }

        if (checkRepayment && checkRepayment.closing) {
            totalDue = totalDue.plus(checkRepayment.closing.totalDue);
        }

        return {totalDue: totalDue.toNumber(), totalPenalty: totalPenalty.toNumber()};
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
            let disbursementDoc = state.get('disbursementDoc'),
                checkRepayment = state.get('checkRepayment');

            doc.type = 'close';

            // Check to payment
            let checkBeforePayment = checkRepayment && doc.repaidDate && doc.amountPaid > 0 && doc.penaltyPaid >= 0;
            if (checkBeforePayment) {
                let makeRepayment = MakeRepayment.close({
                    repaidDate: doc.repaidDate,
                    amountPaid: doc.amountPaid,
                    penaltyPaid: doc.penaltyPaid,
                    scheduleDue: checkRepayment.scheduleDue,
                    scheduleNext: checkRepayment.scheduleNext,
                    closing: checkRepayment.closing
                });

                console.log(makeRepayment);

                doc.totalPaid = doc.amountPaid + doc.penaltyPaid;

                doc.detailDoc = makeRepayment;
                doc.detailDoc.scheduleDue = checkRepayment.scheduleDue;
                doc.detailDoc.totalScheduleDue = checkRepayment.totalScheduleDue;
                doc.detailDoc.scheduleNext = checkRepayment.scheduleNext;
                doc.detailDoc.totalScheduleNext = checkRepayment.totalScheduleNext;
                doc.detailDoc.closing = checkRepayment.closing;
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
AutoForm.addHooks(['Microfis_repaymentClosingForm'], hooksObject);
