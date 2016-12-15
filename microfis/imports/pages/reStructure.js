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
import {lookupLoanAcc} from '../../common/methods/lookup-loan-acc.js';

// Page
import './reStructure.html';

// Declare template
let formTmpl = Template.Microfis_reStructure;


// Form
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        loanAccDoc = stateRepayment.get("loanAccDoc");


    stateRepayment.set('disbursmentDate', moment().toDate());


    this.autorun(() => {

        let disbursementDate = stateRepayment.get('disbursmentDate');


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

            if (loanAccDoc) {
                lookupLoanAcc.callPromise({
                    _id: loanAccDoc._id
                }).then(function (result) {
                    stateRepayment.set('loanAccDoc', result);
                }).catch(function (err) {
                    console.log(err.message);
                });
            }


            let currentData = Template.currentData();
            stateRepayment.set('curData', currentData);

            if (currentData) {
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


                Meteor.setTimeout(() => {
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
        return LoanAcc.reStructure;
    },
    balanceUnPaid() {
        return stateRepayment.get('balanceUnPaid');
    },
    currencyId(){
        let loanDoc = stateRepayment.get('loanAccDoc');
        if (loanDoc) {
            return loanDoc.currencyId;
        }
    }
});

formTmpl.events({
    'click [name="disbursementDate"]'(){
        let $repaidDateObj = $('[name="disbursementDate"]');
        if (stateRepayment.get('lastTransactionDate')) {
            $repaidDateObj.data("DateTimePicker").minDate(moment(stateRepayment.get('lastTransactionDate')).startOf('day').toDate());
        } else {
            let loanDoc = stateRepayment.get("loanAccDoc");
            $repaidDateObj.data("DateTimePicker").minDate(moment(loanDoc.disbursementDate).startOf('day').toDate());
        }
    }

})


formTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_reStructure");
    stateRepayment.set('curData', undefined);
});

// Hook
let hooksObject = {
    onSubmit(doc) {

        let curDoc = stateRepayment.get('curData');
        let loanAccDoc = stateRepayment.get('loanAccDoc');
        if (curDoc.loanAccDoc.status == "Restructure") {
            alertify.error("You already Restructure");
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
                let loanAccDocUpdate = stateRepayment.get("loanAccDoc");
                loanAccDocUpdate.status = "Restructure";

                stateRepayment.set("loanAccDoc", loanAccDocUpdate);


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
