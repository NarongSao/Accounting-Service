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
import {Setting} from '../../common/collections/setting.js';

// Method

import {makeReSchedule} from '../../common/methods/make-reSchedule.js';
import {checkRepayment} from '../../common/methods/check-repayment';
import {makeWaived} from '../../common/methods/make-waived.js';
import {lookupProduct} from '../../common/methods/lookup-product.js';
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';


// Page
import './waived.html';

// Declare template
let formTmpl = Template.Microfis_waived;

// Form
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = stateRepayment.get("loanAccDoc");


    stateRepayment.set('disbursmentDate', moment().toDate());
    Meteor.subscribe("microfis.setting");
    this.autorun(() => {

        let disbursementDate = stateRepayment.get('disbursmentDate');


        if (loanAccDoc.productId) {
            $.blockUI({overlayCSS: {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'}});

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


            if (loanAccDoc) {
                lookupLoanAcc.callPromise({
                    _id: loanAccDoc._id
                }).then(function (result) {
                    stateRepayment.set('loanAccDoc', result);
                }).catch(function (err) {
                    console.log(err.message);
                });
            }

            if (disbursementDate) {
                $.blockUI({overlayCSS: {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'}});

                let currentData = Template.currentData();
                stateRepayment.set('curData', currentData);

                if (currentData) {
                    stateRepayment.set('lastTransactionDate', currentData.disbursementDate);
                    this.subscribe('microfis.loanAccById', loanAccDoc._id);
                }


                // Call check repayment from method
                checkRepayment.callPromise({
                    loanAccId: loanAccDoc._id,
                    checkDate: disbursementDate
                }).then(function (result) {
                    // Set state
                    stateRepayment.set('checkRepayment', result);
                    stateRepayment.set('balanceUnPaid', result.balanceUnPaid);
                    stateRepayment.set('interestUnPaid', result.interestUnPaid);
                    stateRepayment.set('feeOnPaymentUnPaid', result.feeOnPaymentUnPaid);
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

            } else {
                stateRepayment.set('checkRepayment', null);
            }
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
            stateRepayment.set('disbursmentDate', moment(e.date).toDate());
            $firstRepaymentDate.data("DateTimePicker").minDate(moment(e.date).add(1, 'days').startOf('day'));
        });

    }, 100);
});

formTmpl.helpers({

    schema() {
        return LoanAcc.waived;
    },
    balanceUnPaid() {
        return stateRepayment.get('balanceUnPaid');
    },
    interestUnPaid() {
        return stateRepayment.get('interestUnPaid');
    },
    feeOnPaymentUnPaid() {
        return stateRepayment.get('feeOnPaymentUnPaid');
    }

});

formTmpl.events({
    'click [name="waived.waivedDate"]'(){
        let $repaidDateObj = $('[name="waived.waivedDate"]');
        if (stateRepayment.get('lastTransactionDate')) {
            $repaidDateObj.data("DateTimePicker").minDate(moment(stateRepayment.get('lastTransactionDate')).startOf('day').toDate());
        } else {
            let loanDoc = stateRepayment.get("loanAccDoc");
            $repaidDateObj.data("DateTimePicker").minDate(moment(loanDoc.disbursementDate).startOf('day').toDate());
        }
    }
})


formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_waived");
    stateRepayment.set('curData', undefined);
});

// Hook
let hooksObject = {
    onSubmit(doc) {

        let curDoc = stateRepayment.get('curData');
        let loanAccDoc = stateRepayment.get('loanAccDoc');

        if (loanAccDoc.status == "Waived") {
            alertify.warning("You already Waived");
            return false;
        }

        let updateWaived = {status: "Waived", waivedDate: doc.waived.waivedDate};
        updateWaived['waived.waivedDate'] = doc.waived.waivedDate;
        updateWaived['waived.amount'] = doc.waived.amount;
        updateWaived['waived.interest'] = doc.waived.interest;
        updateWaived['waived.feeOnPayment'] = doc.waived.feeOnPayment;
        updateWaived['waived.description'] = doc.waived.description;


        makeWaived.callPromise({
            loanAccId: curDoc.loanAccDoc._id,
            opts: updateWaived
        }).then(function (result) {
            if (result) {
                alertify.success("Success ");
                alertify.waived().close();
                if (result) {
                    lookupLoanAcc.callPromise({
                        _id: curDoc.loanAccDoc._id
                    }).then(function (result) {
                        stateRepayment.set('loanAccDoc', result);
                    }).catch(function (err) {
                        console.log(err.message);
                    });

                }
            }
        }).catch(function (err) {
            console.log(err.message);
            alertify.error("Can't put in waived");
        });
        return false;
    },
    onError (formType, error) {
        displayError(error.message);
    }

};

AutoForm.addHooks([
    'Microfis_waived'
], hooksObject);
