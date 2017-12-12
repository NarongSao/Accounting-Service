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
import {removeWaived} from '../../common/methods/remove-waived';
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
import './repayment.html';
import './repayment-general.js';
import './repayment-prepay.js';
import './repayment-waive-interest.js';
import './repayment-closing.js';
import './repayment-reschedule.js';
import './repayment-writeOff.js';
import './repayment-fee.js';

import './write-off-ensure.js';
import './waived.js';
import './saving-transaction.html';

// Declare template
let indexTmpl = Template.Microfis_repayment,
    scheduleDetailTmpl = Template.Microfis_repaymentDetailSchedule,
    actionTmpl = Template.Microfis_repaymentAction,
    showTmpl = Template.Microfis_repaymentShow,
    showSavingTmpl = Template.Microfis_savingTransactionShow,

    generalFormTmpl = Template.Microfis_repaymentGeneralForm,
    feeFormTmpl = Template.Microfis_repaymentFeeForm,
    prepayFormTmpl = Template.Microfis_repaymentPrepayForm,
    waiveInteFormTmpl = Template.Microfis_repaymentWaiveInterestForm,
    closingFormTmpl = Template.Microfis_repaymentClosingForm,
    writeOffFormTmpl = Template.Microfis_repaymentWriteOffForm,
    writeOffEnsureFormTmpl = Template.Microfis_writeOffEnsure,
    waivedFormTmpl = Template.Microfis_waived,
    rescheduleFormTmpl = Template.Microfis_rescheduleForm,
    reStructureForm = Template.Microfis_reStructure;

// State
stateRepayment = new ReactiveDict();

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('repayment', {size: 'lg'});
    createNewAlertify('writeOff');
    createNewAlertify('waived', {size: "md"});
    createNewAlertify('writeOffEnsure', {size: "md"});
    createNewAlertify('fee', {size: "md"});
    createNewAlertify('repaymentShow');

    // Default stat
    stateRepayment.setDefault({
        loanAccDoc: null,
        scheduleDoc: null,
        lastTransactionDate: null,
        repaidDate: moment().endOf("day").toDate(),
        checkRepayment: null,
        disbursmentDate: null,
        isVoucherId: false
    });

    let loanAccId = FlowRouter.getParam('loanAccId');
    this.autorun(function () {
        if (loanAccId) {
            $.blockUI({overlayCSS: {backgroundColor: '#fff', opacity: 0.1, cursor: 'wait'}});
            // Get loan account doc
            lookupLoanAcc.callPromise({
                _id: loanAccId
            }).then(function (result) {
                stateRepayment.set('loanAccDoc', result);
                stateRepayment.set('lastTransactionDate', result.disbursementDate);
                stateRepayment.set("feeAmount", result.feeAmount);
                stateRepayment.set("isChargFee", result.totalFeeOnDisburment);

                Meteor.setTimeout(() => {
                    $.unblockUI();
                }, 200);
            }).catch(function (err) {
                console.log(err.message);
            });


            // Call check repayment from method
            checkRepayment.callPromise({
                loanAccId: loanAccId,
                checkDate: moment().endOf("day").toDate()
            }).then(function (result) {
                // Set state
                if (result) {
                    stateRepayment.set('checkRepayment', result);
                    stateRepayment.set('lastTransactionDate', result.lastRepayment.repaidDate);
                }
                Meteor.setTimeout(() => {
                    $.unblockUI();
                }, 200);

            }).catch(function (err) {
                console.log(err.message);
            });
        }
    });

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('microfis.repaymentByLoanAcc', ['loanAccId']);
    this.autorun(() => {
        this.filter.set(loanAccId);
    });

});

indexTmpl.helpers({
    loanAccDoc() {

        let doc = stateRepayment.get('loanAccDoc');
        if (doc) {
            if (doc.interestType == "A") {
                doc.interestType = " " + doc.currencyId;
            } else {
                doc.interestType = "%";
            }
        }

        return doc;
    },
    checkPayment(){
        return stateRepayment.get('checkRepayment');
    },
    scheduleDoc() {
        let loanAccId = FlowRouter.getParam('loanAccId');
        let lastScheduleDate = RepaymentSchedule.findOne({loanAccId: loanAccId}, {sort: {scheduleDate: -1}}).scheduleDate;
        let selector = {};
        selector.loanAccId = loanAccId;
        selector.scheduleDate = {$eq: lastScheduleDate};


        let scheduleDoc = RepaymentSchedule.find(selector, {sort: {installment: 1}});
        stateRepayment.set('scheduleDoc', scheduleDoc.fetch());

        return scheduleDoc;
    },
    tabularTable() {
        let selector = {loanAccId: FlowRouter.getParam('loanAccId')};
        return {
            RepaymentTabular: RepaymentTabular,
            selector: selector
        };
    },
    tabularLoan() {
        let selector = {parentId: FlowRouter.getParam('loanAccId')};
        return {
            tabularTable: LoanAccRestructureTabular,
            selector: selector
        };
    },
    tabularSavingTransaction() {
        let selector = {savingAccId: FlowRouter.getParam('savingAccId')};
        return {
            tabularTable: SavingTransactionTabular,
            selector: selector
        };
    },
    tableSettings() {
        let reactiveTableData = _.assignIn(_.clone(reactiveTableSettings), {
            collection: 'microfis.reactiveTable.repayment',
            filters: ['microfis.repaymentByLoanAcc'],
            fields: [
                {
                    key: '_id',
                    label: 'ID',
                    sortOrder: 0,
                    sortDirection: 'desc',
                    hidden: true
                },
                {
                    key: 'repaidDate',
                    label: 'Paid Date',
                    fn(value, object, key) {
                        return moment(value).format('DD/MM/YYYY');
                    }
                },
                {key: 'type', label: 'Type'},
                {
                    key: 'voucherId', label: 'Voucher',
                    fn(value, object, key){
                        return value.substr(8, value.length - 1);
                    }
                },
                {
                    key: 'detailDoc.totalSchedulePaid.totalPrincipalInterestDue',
                    label: 'Amount Due',
                    fn(value, object, key) {
                        return numeral(value).format('0,0.00');
                    }
                },
                {
                    key: 'detailDoc.totalSchedulePaid.penaltyDue',
                    label: 'Penalty Due',
                    fn(value, object, key) {
                        return numeral(value).format('0,0.00');
                    }
                },
                {
                    key: 'amountPaid',
                    label: 'Amount Paid',
                    fn(value, object, key) {
                        return numeral(value).format('0,0.00');
                    }
                },
                {
                    key: 'penaltyPaid',
                    label: 'Penalty Paid',
                    fn(value, object, key) {
                        return numeral(value).format('0,0.00');
                    }
                },
                {
                    key: 'detailDoc.totalSchedulePaid.totalPrincipalInterestBal',
                    label: 'Overdue Amount',
                    fn(value, object, key) {
                        if (value > 0) {
                            return Spacebars.SafeString('<span class="text-red">' + numeral(value).format('0,0.00') + '</span>');
                        }
                        return numeral(value).format('0,0.00');
                    }
                },
                {
                    key: '_id',
                    label() {
                        return fa('bars', '', true);
                    },
                    headerClass: function () {
                        let css = 'text-center col-action';
                        return css;
                    },
                    tmpl: actionTmpl, sortable: false
                }
            ],
        });

        return reactiveTableData;
    },
    isFee(){
        let isFee = false;
        let isOther = true;

        if (stateRepayment.get("feeAmount") == 0 && stateRepayment.get("isChargFee") > 0 && stateRepayment.get('loanAccDoc').parentId == "0") {
            isFee = true;
            isOther = false;
        } else {
            isOther = true;
            isFee = false;
        }
        return {isOther, isFee};
    }

});

indexTmpl.events({
    'click .js-create-payment'(event, instance) {
        stateRepayment.set("isVoucherId", true);

        let data = {loanAccDoc: stateRepayment.get('loanAccDoc'),};
        alertify.repayment(fa('plus', 'Repayment General'), renderTemplate(generalFormTmpl, data));
    },
    'click .js-create-prepay'(event, instance) {

        stateRepayment.set("isVoucherId", true);
        let data = {loanAccDoc: stateRepayment.get('loanAccDoc'),};
        alertify.repayment(fa('plus', 'Prepay'), renderTemplate(prepayFormTmpl, data));
    }
    , 'click .js-create-reschedule'(event, instance) {

        stateRepayment.set("isVoucherId", true);
        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };
        alertify.repayment(fa('plus', 'Principal Installment'), renderTemplate(rescheduleFormTmpl, data));

    },
    'click .js-create-waive-interest'(event, instance) {
    },
    'click .js-create-write-off-ensure'(event, instance) {

        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };

        alertify.writeOffEnsure(fa('plus', 'Write-Off Ensure'), renderTemplate(writeOffEnsureFormTmpl, data));

    },
    'click .js-waived'(event, instance) {

        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };

        alertify.waived(fa('plus', 'Waived'), renderTemplate(waivedFormTmpl, data));

    }, 'click .js-create-write-off'(event, instance) {

        stateRepayment.set("isVoucherId", true);

        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };

        alertify.repayment(fa('plus', 'Repayment Write-Off'), renderTemplate(writeOffFormTmpl, data));

    },
    'click .js-create-close'(event, instance) {
        stateRepayment.set("isVoucherId", true);

        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };

        alertify.repayment(fa('plus', 'Repayment Closing'), renderTemplate(closingFormTmpl, data));
    },

    'click .js-create-fee'(event, instance) {
        stateRepayment.set("isVoucherId", true);

        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };

        alertify.fee(fa('plus', 'Repayment Fee'), renderTemplate(feeFormTmpl, data));
    },

    'click .js-reStructure' (event, instance) {

        //            $.blockUI({     overlayCSS: {         backgroundColor: '#fff',         opacity: 0.1,         cursor: 'wait'     } });
        let data = {
            loanAccDoc: stateRepayment.get('loanAccDoc'),
            scheduleDoc: stateRepayment.get('scheduleDoc'),
        };
        alertify.repayment(fa('plus', 'Loan Account'), renderTemplate(reStructureForm, data));

    },
    'click .js-destroy'(event, instance) {
        /*destroyAction(
         Repayment,
         {_id: this._id},
         {title: 'Repayment', itemTitle: this._id}
         );*/

        let self = this;
        let loanAccDoc = stateRepayment.get('loanAccDoc');
        stateRepayment.set("repaidDate", self.repaidDate);

        Meteor.call('microfis_getLastEndOfProcess', self.branchId, function (err, endOfProcess) {
            // if (endOfProcess == undefined || endOfProcess.closeDate.getTime() < self.repaidDate.getTime() || self.type == "Write Off") {
            if (endOfProcess == undefined || endOfProcess.closeDate.getTime() < self.repaidDate.getTime()) {
                if (self.endId == "0") {
                    getLastRepayment.callPromise({
                        loanAccId: loanAccDoc._id
                    }).then(function (doc) {
                        /*if (loanAccDoc.status !== "Active") {
                         alertify.warning("Not in Active Status!!!!!!!!");
                         return false;
                         }*/

                        if (doc.repaidDate.getTime() == self.repaidDate.getTime()) {
                            swal({
                                title: 'Are you sure?',
                                text: `You won't be able to revert this <span class="text-red text-bold">[${self._id}]</span>!`,
                                type: 'warning',
                                allowEscapeKey: false,
                                allowOutsideClick: true,
                                showCloseButton: true,
                                showConfirmButton: true,
                                confirmButtonColor: "#dd4b39",
                                confirmButtonText: 'Yes, delete it!',
                                showCancelButton: true
                            }).then(function () {
                                Repayment.remove({_id: self._id}, function (error) {
                                    if (error) {
                                        // sAlert.error(options.errorMsg ? options.errorMsg : error.message);
                                        displayError(options.errorMsg, options.i18n);
                                    } else {


                                        updateLoanAccPaymentWrteOff.callPromise({
                                            loanAccId: loanAccDoc._id,
                                            opts: loanAccDoc,
                                            repaidDate: stateRepayment.get('repaidDate')
                                        }).then(function (result) {

                                        }).catch(function (err) {
                                            console.log(err.message);
                                        });

                                        Meteor.setTimeout(function () {
                                            lookupLoanAcc.callPromise({
                                                _id: loanAccDoc._id
                                            }).then(function (docLoanAcc) {
                                                if (docLoanAcc) {

                                                    stateRepayment.set('loanAccDoc', docLoanAcc);

                                                }
                                            }).catch(function (err) {
                                                console.log(err.message);
                                            });
                                        }, 200)

                                        if (self.type == "Fee") {
                                            stateRepayment.set("feeAmount", 0);
                                        }


                                        checkRepayment.callPromise({
                                            loanAccId: stateRepayment.get('loanAccDoc')._id,
                                            checkDate: stateRepayment.get('repaidDate')
                                        }).then(function (result) {
                                            // Set state
                                            stateRepayment.set('checkRepayment', result);

                                        }).catch(function (err) {
                                            console.log(err.message);
                                        });


                                        displaySuccess(`Your doc <span class="text-red">[${self._id}]</span> has been deleted`);
                                    }
                                });
                            }).done();
                        } else {
                            alertify.error("Not the last payment!!!");
                        }
                    }).catch(function (err) {
                        console.log(err.message);
                    });
                } else {
                    alertify.error("Already End Of Process!!!");
                }
            } else {
                alertify.error("Already End Of Process or Clear Prepay!!!");
            }
        })


    },
    'click .js-removeWriteOff'(event, instance) {
        let self = this;
        Meteor.call('microfis_getLastEndOfProcess', self.branchId, function (err, endOfProcess) {
            if (endOfProcess == undefined || endOfProcess.closeDate.getTime() < self.writeOff.writeOffDate.getTime()) {

                let loanAccDoc = stateRepayment.get('loanAccDoc');
                if (loanAccDoc.paymentWriteOff && loanAccDoc.paymentWriteOff.length > 1) {
                    alertify.error("Can't remove wirte off, you already make repayment!!!!");
                } else {

                    let opts = {};

                    opts.writeOff = "";
                    opts.writeOffDate = "";
                    opts.paymentWriteOff = "";

                    if (loanAccDoc.paymentWriteOff && loanAccDoc.paymentWriteOff.length == 1) {
                        alertify.confirm(
                            fa("remove", "Write Off"),
                            "Are you sure to delete write off?",
                            function () {
                                removeWriteOffEnsure.callPromise({
                                    loanAccId: loanAccDoc._id,
                                    opts: opts
                                }).then(function (result) {
                                    alertify.success("Remove Success.");

                                    lookupLoanAcc.callPromise({
                                        _id: loanAccDoc._id
                                    }).then(function (result) {
                                        stateRepayment.set('loanAccDoc', result);
                                    }).catch(function (err) {
                                        console.log(err.message);
                                    });


                                }).catch(function (err) {
                                    alertify.error(err.message);
                                    console.log(err.message);
                                });
                            },
                            null
                        );
                    } else {
                        alertify.error("You already payment!!!!!");
                    }

                }
            } else {
                alertify.error("Already End Of Process!!!");
            }
        })

    },
    'click .js-removeWaived'(event, instance) {
        let self = this;
        Meteor.call('microfis_getLastEndOfProcess', self.branchId, function (err, endOfProcess) {
            if (endOfProcess == undefined || endOfProcess.closeDate.getTime() < self.waived.waivedDate.getTime()) {

                let loanAccDoc = stateRepayment.get('loanAccDoc');

                let opts = {};

                opts.waived = "";
                opts.waivedDate = "";


                alertify.confirm(
                    fa("remove", "Waived"),
                    "Are you sure to delete waived?",
                    function () {
                        removeWaived.callPromise({
                            loanAccId: loanAccDoc._id,
                            opts: opts
                        }).then(function (result) {
                            alertify.success("Remove Success.");

                            lookupLoanAcc.callPromise({
                                _id: loanAccDoc._id
                            }).then(function (result) {
                                stateRepayment.set('loanAccDoc', result);
                            }).catch(function (err) {
                                console.log(err.message);
                            });


                        }).catch(function (err) {
                            alertify.error(err.message);
                            console.log(err.message);
                        });
                    },
                    null
                );


            } else {
                detailDoc.totalSchedulePaid.totalPrincipalInterestDue
                alertify.error("Already End Of Process!!!");
            }
        })

    },
    'click .js-display'(event, instance) {
        let self = this;
        self.voucherId = self.voucherId.substr(8, self.voucherId.length - 1)
        alertify.repaymentShow(fa('eye', 'Repayment'), renderTemplate(showTmpl, self));
    },
    'click .js-display-savingTransaction'(event, instance) {
        alertify.repaymentShow(fa('eye', 'Repayment'), renderTemplate(showSavingTmpl, this));
    },
    'click .js-destroy-savingTransaction' (event, instance) {
        if (this.paymentId == "0") {
            destroyAction(
                SavingTransaction,
                {_id: this._id},
                {title: 'SavingTransaction', itemTitle: this._id}
            );
        } else {
            alertify.error("Can't remove !!!!");
        }
    }
});

// Schedule detail
scheduleDetailTmpl.helpers({
    checkStatusAttr(item) {
        let className = '';

        if (item.installment == 0) {
            className = 'active';
        } else {
            if (item.repaymentDoc && item.repaymentDoc.detail && item.repaymentDoc.detail.length > 0) {
                let lastStatus = _.last(item.repaymentDoc.detail);
                if (lastStatus.status == 'Complete') {
                    className = 'success';
                } else if (lastStatus.status == 'Partial') {
                    className = 'warning';
                }
            } else if (item.isPrePay == true) {
                className = 'danger';
            }
        }

        return {class: className};
    },
    principalInterestPaid(repaymentDoc) {
        if (repaymentDoc) {
            return repaymentDoc.totalPrincipalPaid + repaymentDoc.totalInterestPaid + repaymentDoc.totalFeeOnPaymentPaid;
        }
        return 0;
    },
    outstanding(item) {
        if (item.repaymentDoc) {
            let totalPaidAndInterestWaived = (item.repaymentDoc.totalPrincipalPaid + item.repaymentDoc.totalInterestPaid + item.repaymentDoc.totalInterestWaived + item.repaymentDoc.totalFeeOnPaymentPaid + item.repaymentDoc.totalFeeOnPaymentWaived )
            return item.totalDue - totalPaidAndInterestWaived;
        } else {
            return item.totalDue;
        }
    }
});


indexTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_repayment");
});
