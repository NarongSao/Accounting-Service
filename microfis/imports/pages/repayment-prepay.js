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
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Page
import './repayment-prepay.html';

// Declare template
let formTmpl = Template.Microfis_repaymentPrepayForm;


//-------- Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = stateRepayment.get("loanAccDoc");

    // Set min/max amount to simple schema
    let minMaxAmount = 0.01;
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
        let repaidDate = stateRepayment.get('repaidDate');

        if (stateRepayment.get("isVoucherId")) {
            var currentCurrency = loanAccDoc.currencyId;
            var dobSelect = repaidDate;

            var startYear = moment(dobSelect).year();
            var startDate = moment('01/01/' + startYear,"DD/MM/YYYY").toDate();
            Meteor.call('microfis_getLastVoucher', currentCurrency, startDate,Session.get("currentBranch"), function (err, result) {
                if (result != undefined) {
                    Session.set('lastVoucherId', parseInt((result.voucherId).substr(8, 13)) + 1);
                } else {
                    Session.set('lastVoucherId', "000001");
                }
                stateRepayment.set("isVoucherId",false);
            });
        }

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
            checkRepayment.callPromise({
                loanAccId: loanAccDoc._id,
                checkDate: repaidDate
            }).then(function (result) {

                // Set state
                stateRepayment.set('checkRepayment', result);

                // Set max amount on simple schema
                if (result && result.totalScheduleNext) {
                    let maxAmountPaid = result.totalScheduleNext.totalPrincipalInterestDue - Session.get('minAmountPaid');
                    Session.set('maxAmountPaid', maxAmountPaid);
                }

                // Set last repayment
                if (result.lastRepayment) {
                    Meteor.call("microfis_getLastEndOfProcess", Session.get('currentBranch'), function (err, endDoc) {
                        if (endDoc) {
                            if (moment(endDoc.closeDate).toDate().getTime() > moment(result.lastRepayment.repaidDate).toDate().getTime()) {
                                stateRepayment.set('lastTransactionDate', moment(endDoc.closeDate).startOf('day').add(1, "days").toDate());
                            } else {
                                stateRepayment.set('lastTransactionDate', result.lastRepayment.repaidDate);
                            }
                        } else {
                            stateRepayment.set('lastTransactionDate', result.lastRepayment.repaidDate);
                        }
                    })
                }

                Meteor.setTimeout(()=> {
                    $.unblockUI();
                }, 200);

            }).catch(function (err) {
                console.log(err.message);
            });

        } else {
            stateRepayment.set('checkRepayment', null);
        }
    });

});

formTmpl.onRendered(function () {
    let $repaidDateObj = $('[name="repaidDate"]');
    if ($repaidDateObj) {
        let repaidDate = moment($repaidDateObj.data("DateTimePicker").date()).toDate();

        stateRepayment.set('repaidDate', repaidDate);

        // Repaid date picker
        $repaidDateObj.data("DateTimePicker").minDate(moment(stateRepayment.get('lastTransactionDate')).startOf('day'));
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
    checkRepayment(){
        return stateRepayment.get('checkRepayment');
    },
    defaultValue(){
        // let totalDue = Session.get('maxAmountPaid'),
        let totalDue = 0,
            totalPenalty = 0,
            checkRepayment = stateRepayment.get('checkRepayment');

        if (checkRepayment && checkRepayment.scheduleNext[0]) {
            totalDue = checkRepayment.scheduleNext[0].totalDue;
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
    },
    voucherId(){
        return Session.get('lastVoucherId');
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
    AutoForm.resetForm("Microfis_repaymentPrepayForm");

});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let loanAccDoc = stateRepayment.get('loanAccDoc'),
                checkRepayment = stateRepayment.get('checkRepayment');

            var year = moment(doc.repaidDate).format("YYYY");
            doc.voucherId = doc.branchId + "-" + year + s.pad(doc.voucherId, 6, "0");

            doc.type = 'Prepay';

            if (loanAccDoc.status == "Restructure") {
                alertify.warning("You already Restructure");
                return false;
            }

            if (loanAccDoc.status == "Close") {
                alertify.warning("You already Close");
                return false;
            }

            // Check have current due amount
            if (checkRepayment && checkRepayment.scheduleDue && checkRepayment.scheduleDue.length > 0) {
                displayError("Have current due amount, so can't prepay");
                return false;
            }

            if (checkRepayment.balanceUnPaid - doc.loanAmount <= 0) {
                alertify.warning("You should go to Closing");
                return false;
            }

            //Check write Off
            if (loanAccDoc.writeOffDate != null) {
                alertify.warning("You already write off!!!");
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
                AutoForm.resetForm("Microfis_repaymentGeneralForm");


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
