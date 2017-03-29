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
import {checkRepayment} from '../../common/methods/check-repayment';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

// Page
import './repayment-closing.html';

// Declare template
let formTmpl = Template.Microfis_repaymentClosingForm;


//-------- General Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData();

    // Set min/max amount to simple schema
    let minMaxAmount;

    // Track autorun
    this.autorun(function () {
        let loanAccDoc = stateRepayment.get("loanAccDoc");


        let repaidDate = stateRepayment.get('repaidDate');
        if (stateRepayment.get("isVoucherId")) {
            var currentCurrency = loanAccDoc.currencyId;
            var dobSelect = repaidDate;

            var startYear = moment(dobSelect).year();
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
            $.blockUI();

            let totalSavingBal = new BigNumber(0);

            if (loanAccDoc) {


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
                // Session.set('maxAmountPaid', minMaxAmount);
                Session.set('maxPenaltyPaid', minMaxAmount);


                lookupLoanAcc.callPromise({
                    _id: loanAccDoc._id
                }).then(function (result) {
                    stateRepayment.set('loanAccDoc', result);
                }).catch(function (err) {
                    console.log(err.message);
                });

                Meteor.call('microfis_getLastSavingTransaction', loanAccDoc.savingAccId, function (err, data) {
                    if (data) {
                        stateRepayment.set('savingBalance', data);
                        totalSavingBal = totalSavingBal.plus(data.details.principalBal).plus(data.details.interestBal);
                    }
                });


                // Call check repayment from method
                checkRepayment.callPromise({
                    loanAccId: loanAccDoc._id,
                    checkDate: repaidDate
                }).then(function (result) {
                    // Set state
                    stateRepayment.set('checkRepayment', result);

                    // Set max amount on simple schema
                    let maxAmountPaid = new BigNumber(0);
                    let minAmountPaid = new BigNumber(0);


                    if (result && result.totalScheduleDue) {
                        // maxAmountPaid = maxAmountPaid.plus(result.totalScheduleDue.totalPrincipalInterestDue);
                        Session.set('maxPenaltyPaid', result.totalScheduleDue.penaltyDue);


                    }
                    // if (result && result.closing) {
                    //     maxAmountPaid = maxAmountPaid.plus(result.closing.totalDue);
                    // }
                    // if (maxAmountPaid.greaterThan(0)) {
                    //     Session.set('maxAmountPaid', maxAmountPaid.toNumber());
                    // }

                    if (result && result.closing) {
                        minAmountPaid = minAmountPaid.plus(result.closing.totalDue).minus(totalSavingBal);
                        Session.set('minAmountPaid', minAmountPaid.toNumber());
                    }

                    // Set last repayment
                    if (result.lastRepayment) {
                        Meteor.call("microfis_getLastEndOfProcess", Session.get('currentBranch'), loanAccDoc._id, function (err, endDoc) {
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

                    Meteor.setTimeout(() => {
                        $.unblockUI();
                    }, 200);

                }).catch(function (err) {
                    console.log(err.message);
                });
            }


        } else {
            stateRepayment.set('checkRepayment', null);
        }
    });

});


formTmpl.onRendered(function () {
    let $repaidDateObj = $('[name="repaidDate"]');

    // Repaid date picker
    if ($repaidDateObj) {
        let repaidDate = moment($repaidDateObj.data("DateTimePicker").date()).toDate();
        stateRepayment.set('repaidDate', repaidDate);
        stateRepayment.set("isVoucherId", true);

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
        let totalDue = new BigNumber(0),
            totalPenalty = new BigNumber(0),
            checkRepayment = stateRepayment.get('checkRepayment');

        let data = stateRepayment.get('savingBalance');

        if (checkRepayment && checkRepayment.totalScheduleDue) {
            totalPenalty = totalPenalty.plus(checkRepayment.totalScheduleDue.penaltyDue);
            totalDue = totalDue.plus(checkRepayment.totalScheduleDue.totalPrincipalInterestDue);
        }

        if (checkRepayment && checkRepayment.closing) {
            totalDue = totalDue.plus(checkRepayment.closing.totalDue).minus(data.details.principalBal).minus(data.details.interestBal);
        }

        return {totalDue: totalDue.toNumber(), totalPenalty: totalPenalty.toNumber()};
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
    savingBal(){
        let data = stateRepayment.get('savingBalance');
        if (data) {
            data.totalBal = data.details.interestBal + data.details.principalBal;
            return data;
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
    },
    'keypress [name="voucherId"]': function (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ($(evt.currentTarget).val().indexOf('.') != -1) {
            if (charCode == 46) {
                return false;
            }
        }
        return !(charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57));
    }
})

formTmpl.onDestroyed(function () {
    Session.set('minAmountPaid', null);
    Session.set('maxAmountPaid', null);
    Session.set('maxPenaltyPaid', null);

    AutoForm.resetForm("Microfis_repaymentClosingForm");

});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let loanAccDoc = stateRepayment.get('loanAccDoc'),
                checkRepayment = stateRepayment.get('checkRepayment');


            var year = moment(doc.repaidDate).format("YYYY");
            doc.voucherId = doc.branchId + "-" + year + s.pad(doc.voucherId, 6, "0");


            doc.type = 'Close';
            //Check Status
            if (loanAccDoc.status == "Restructure") {
                alertify.warning("You already Restructure");
                return false;
            }

            if (loanAccDoc.status == "Close") {
                alertify.warning("You already Close");
                return false;
            }

            //Check write Off
            if (loanAccDoc.writeOffDate != null) {
                alertify.warning("You already write off!!!");
                return false;
            }

            let totalPaidClosing = doc.savingBalance + doc.amountPaid;

            // Check to payment
            let checkBeforePayment = checkRepayment && doc.repaidDate && doc.amountPaid > 0 && doc.penaltyPaid >= 0;
            if (checkBeforePayment) {
                let makeRepayment = MakeRepayment.close({
                    repaidDate: doc.repaidDate,
                    amountPaid: totalPaidClosing,
                    penaltyPaid: doc.penaltyPaid,
                    scheduleDue: checkRepayment.scheduleDue,
                    scheduleNext: checkRepayment.scheduleNext,
                    closing: checkRepayment.closing,
                    principalUnpaid: checkRepayment.balanceUnPaid
                });


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
        let loanAccDoc = stateRepayment.get('loanAccDoc');
        loanAccDoc.status = "Close";

        stateRepayment.set('loanAccDoc', loanAccDoc);


        checkRepayment.callPromise({
            loanAccId: loanAccDoc._id,
            checkDate: stateRepayment.get('repaidDate')
        }).then(function (result) {
            // Set state
            stateRepayment.set('checkRepayment', result);

        }).catch(function (err) {
            console.log(err.message);
        });

        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Microfis_repaymentClosingForm'], hooksObject);
