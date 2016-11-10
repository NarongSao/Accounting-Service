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

// API Lib
import {MakeRepayment} from '../../common/libs/make-repayment.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';
import {RepaymentSchedule} from '../../common/collections/repayment-schedule.js';

// Tabular
import {RepaymentTabular} from '../../common/tabulars/repayment.js';

// Page
import './repayment.html';
import './repayment-general.js';
import './repayment-prepay.js';
import './repayment-waive-interest.js';
import './repayment-closing.js';
import './repayment-reschedule.js';
import './repayment-writeOff.js';

import './write-off-ensure.js';

// Declare template
let indexTmpl = Template.Microfis_repayment,
    scheduleDetailTmpl = Template.Microfis_repaymentDetailSchedule,
    actionTmpl = Template.Microfis_repaymentAction,
    showTmpl = Template.Microfis_repaymentShow,

    generalFormTmpl = Template.Microfis_repaymentGeneralForm,
    prepayFormTmpl = Template.Microfis_repaymentPrepayForm,
    waiveInteFormTmpl = Template.Microfis_repaymentWaiveInterestForm,
    closingFormTmpl = Template.Microfis_repaymentClosingForm,
    writeOffFormTmpl = Template.Microfis_repaymentWriteOffForm,
    writeOffEnsureFormTmpl = Template.Microfis_writeOffEnsure,
    rescheduleFormTmpl = Template.Microfis_rescheduleForm,
    reStructureForm=Template.Microfis_reStructure;

// State
let state = new ReactiveDict();

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('repayment', {size: 'lg'});
    createNewAlertify('repaymentShow');

    // Default stat
    state.setDefault({
        loanAccDoc: null,
        scheduleDoc: null
    });

    let loanAccId = FlowRouter.getParam('loanAccId');
    this.autorun(function () {
        if (loanAccId) {
            $.blockUI();

            // Get loan account doc
            lookupLoanAcc.callPromise({
                _id: loanAccId
            }).then(function (result) {
                state.set('loanAccDoc', result);

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
        return state.get('loanAccDoc');
    },
    scheduleDoc() {
        let loanAccId = FlowRouter.getParam('loanAccId');
        let lastScheduleDate = RepaymentSchedule.findOne({loanAccId: loanAccId}, {sort: {scheduleDate: -1}}).scheduleDate;
        let selector = {};
        selector.loanAccId = loanAccId;
        selector.scheduleDate = {$eq: lastScheduleDate};


        let scheduleDoc = RepaymentSchedule.find(selector, {sort: {installment: 1}});
        state.set('scheduleDoc', scheduleDoc.fetch());

        return scheduleDoc;
    },
    tabularTable() {
        let selector = {loanAccId: FlowRouter.getParam('loanAccId')};
        return {
            tabularTable: RepaymentTabular,
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
    }
});

indexTmpl.events({
    'click .js-create-payment'(event, instance) {
        let data = {loanAccDoc: state.get('loanAccDoc'),};
        alertify.repayment(fa('plus', 'Repayment General'), renderTemplate(generalFormTmpl, data));
    },
    'click .js-create-prepay'(event, instance) {
        let data = {loanAccDoc: state.get('loanAccDoc'),};
        alertify.repayment(fa('plus', 'Repayment Prepay'), renderTemplate(prepayFormTmpl, data));
    }
    , 'click .js-create-reschedule'(event, instance) {
        let data = {
            loanAccDoc: state.get('loanAccDoc'),
            scheduleDoc: state.get('scheduleDoc'),
        };
        alertify.repayment(fa('plus', 'Principal Installment'), renderTemplate(rescheduleFormTmpl, data));

    },
    'click .js-create-waive-interest'(event, instance) {
    },
    'click .js-create-write-off-ensure'(event, instance) {
        let data = {
            loanAccDoc: state.get('loanAccDoc'),
            scheduleDoc: state.get('scheduleDoc'),
        };

        alertify.repayment(fa('plus', 'Write-Off Ensure'), renderTemplate(writeOffEnsureFormTmpl, data));
        
    },'click .js-create-write-off'(event, instance) {
        let data = {
            loanAccDoc: state.get('loanAccDoc'),
            scheduleDoc: state.get('scheduleDoc'),
        };

        alertify.repayment(fa('plus', 'Repayment Write-Off'), renderTemplate(writeOffFormTmpl, data));

    },
    'click .js-create-close'(event, instance) {
        let data = {
            loanAccDoc: state.get('loanAccDoc'),
            scheduleDoc: state.get('scheduleDoc'),
        };

        alertify.repayment(fa('plus', 'Repayment Closing'), renderTemplate(closingFormTmpl, data));
    },

    'click .js-reStructure' (event, instance) {
        // $.blockUI();

        let data = {
            loanAccDoc: state.get('loanAccDoc'),
            scheduleDoc: state.get('scheduleDoc'),
        };
        alertify.repayment(fa('plus', 'Loan Account'), renderTemplate(reStructureForm, data));

    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            Repayment,
            {_id: this._id},
            {title: 'Repayment', itemTitle: this._id}
        );
    },
    'click .js-display'(event, instance) {
        alertify.repaymentShow(fa('eye', 'Repayment'), renderTemplate(showTmpl, this));
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
            }
        }

        return {class: className};
    },
    principalInterestPaid(repaymentDoc) {
        if (repaymentDoc) {
            return repaymentDoc.totalPrincipalPaid + repaymentDoc.totalInterestPaid;
        }
        return 0;
    },
    outstanding(item) {
        if (item.repaymentDoc) {
            let totalPaidAndInterestWaived = (item.repaymentDoc.totalPrincipalPaid + item.repaymentDoc.totalInterestPaid + item.repaymentDoc.totalInterestWaived)
            return item.totalDue - totalPaidAndInterestWaived;
        } else {
            return item.totalDue;
        }
    }
});
