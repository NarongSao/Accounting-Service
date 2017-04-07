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

// API Lib
import {MakeRepayment} from '../../common/libs/make-repayment.js';

// Method
import {checkRepayment} from '../../common/methods/check-repayment';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

// Page
import './repayment-fee.html';

// Declare template
let formTmpl = Template.Microfis_repaymentFeeForm;


//-------- Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData();


    // Set min/max amount to simple schema
    let minMaxAmount = 0;
    let isBlock = false;

    // Track autorun
    this.autorun(function () {


        let repaidDate = stateRepayment.get('repaidDate'),
            loanAccDoc = stateRepayment.get("loanAccDoc");

        if (loanAccDoc) {

            switch (loanAccDoc.currencyId) {
                case 'KHR':
                    minMaxAmount = 0;
                    break;
                case 'USD':
                    minMaxAmount = 0;
                    break;
                case 'THB':
                    minMaxAmount = 0;
                    break;
            }
            Session.set('minAmountPaid', minMaxAmount);
            // Session.set('maxAmountPaid', minMaxAmount);
            Session.set('maxPenaltyPaid', minMaxAmount);


            //Auto Voucher
            if (stateRepayment.get("isVoucherId")) {

                var currentCurrency = loanAccDoc.currencyId;

                var startYear = moment(repaidDate).year();
                var startDate = moment('01/01/' + startYear, "DD/MM/YYYY").toDate();
                Meteor.call('microfis_getLastVoucher', currentCurrency, startDate, Session.get("currentBranch"), function (err, result) {
                    if (result != undefined) {
                        Session.set('lastVoucherId', parseInt((result.voucherId).substr(8, 13)) + 1);
                    } else {
                        Session.set('lastVoucherId', "000001");
                    }
                    stateRepayment.set("isVoucherId", false);
                });
            }


            if (repaidDate) {

                if (isBlock == false) {
                    $.blockUI({
                        onBlock: function () {
                            isBlock = true;
                        }
                    });
                }

                if (loanAccDoc) {
                    lookupLoanAcc.callPromise({
                        _id: loanAccDoc._id
                    }).then(function (result) {
                        stateRepayment.set('loanAccDoc', result);

                        Meteor.setTimeout(() => {
                            $.unblockUI();
                        }, 200);
                    }).catch(function (err) {
                        console.log(err.message);
                    });
                }

            }
        }
    });

});

formTmpl.onRendered(function () {


    let $repaidDateObj = $('[name="repaidDate"]');
    if ($repaidDateObj) {
        let repaidDate = moment($repaidDateObj.data("DateTimePicker").date()).toDate();
        stateRepayment.set('repaidDate', repaidDate);

        stateRepayment.set("isVoucherId", true);
        // Repaid date picker

        $repaidDateObj.on("dp.change", function (e) {
            stateRepayment.set('repaidDate', moment(e.date).toDate());
            stateRepayment.set("isVoucherId", true);
        });
    }

});

formTmpl.helpers({
    collection(){
        return Repayment;
    },
    defaultValue(){
        let totalDue = 0,
            totalPenalty = 0;

        let loanDoc = stateRepayment.get('loanAccDoc');
        if (loanDoc) {
            totalDue = loanDoc.totalFeeOnDisburment;
        }

        return {totalDue, totalPenalty};
    },
    jsonViewData(data){
        if (data) {
            if (_.isArray(data) && data.length > 0) {
                _.forEach(data, (o, k) => {
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
    },
    voucherId(){
        return Session.get('lastVoucherId');
    },
    feeDate(){
        let loanDoc = stateRepayment.get('loanAccDoc');
        if (loanDoc) {
            return loanDoc.disbursementDate;
        }
    },
    loanAccId(){
        if (stateRepayment.get('loanAccDoc')) {
            return stateRepayment.get('loanAccDoc')._id;
        }
    }
});

formTmpl.events({
    'click [name="repaidDate"]'(){
        let $repaidDateObj = $('[name="repaidDate"]');
        if (stateRepayment.get('lastTransactionDate')) {
            $repaidDateObj.data("DateTimePicker").minDate(moment(stateRepayment.get('lastTransactionDate')).startOf('day').toDate());
        } else {
            let loanDoc = stateRepayment.get("loanAccDoc");
            $repaidDateObj.data("DateTimePicker").minDate(moment(loanDoc.disbursementDate).startOf('day').toDate());
        }
    }
})


formTmpl.onDestroyed(function () {
    Session.set('minAmountPaid', null);
    Session.set('maxAmountPaid', null);
    Session.set('maxPenaltyPaid', null);
    AutoForm.resetForm("Microfis_repaymentFeeForm");


});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            doc.type = 'Fee';

            var year = moment(doc.repaidDate).format("YYYY");
            doc.voucherId = doc.branchId + "-" + year + s.pad(doc.voucherId, 6, "0");

            this.result(doc);
        }
    },
    onSuccess (formType, result) {

        stateRepayment.set("feeAmount", 3);
        alertify.fee().close();

        displaySuccess();
        Session.set("resetQuickPayment", true);
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Microfis_repaymentFeeForm'], hooksObject);
