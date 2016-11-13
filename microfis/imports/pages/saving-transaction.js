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
import {lookupSavingAcc} from '../../common/methods/lookup-saving-acc';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction';

// Tabular
import {SavingTransactionTabular} from '../../common/tabulars/saving-transaction';

// Page
import './saving-transaction.html';
import './saving-transaction-deposit.js';
import './saving-transaction-withdrawal.js';

// Declare template
let indexTmpl = Template.Microfis_savingTransaction,
    actionTmpl = Template.Microfis_savingTransactionAction,
    showTmpl = Template.Microfis_savingTransactionShow,

    depositFormTmpl = Template.Microfis_savingTransactionDepositForm,
    withdrawalFormTmpl = Template.Microfis_savingTransactionWithdrawalForm;

// State
let state = new ReactiveDict();

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('savingTransaction', {size: 'lg'});
    createNewAlertify('savingTransactionShow');

    // Default stat
    state.setDefault({
        savingAccDoc: null,
    });

    this.autorun(function () {
        let savingAccId = FlowRouter.getParam('savingAccId');

        if (savingAccId) {
            $.blockUI();

            // Get disbursement doc
            lookupSavingAcc.callPromise({
                savingAccId: savingAccId
            }).then(function (result) {
                state.set('savingAccDoc', result);
                Session.set('savingAccDoc', result);

                Meteor.setTimeout(()=> {
                    $.unblockUI();
                }, 200);
            }).catch(function (err) {
                console.log(err.message);
            });
        }
    })
});

indexTmpl.helpers({
    savingAccDoc(){
        return state.get('savingAccDoc');
    },
    tabularTable(){
        let selector = {savingAccId: FlowRouter.getParam('savingAccId')};
        return {
            tabularTable: SavingTransactionTabular,
            selector: selector
        };
    },
});

indexTmpl.events({
    'click .js-create-deposit' (event, instance) {
        let data = {savingAccDoc: state.get('savingAccDoc'),};
        alertify.savingTransaction(fa('plus', 'Saving Deposit'), renderTemplate(depositFormTmpl, data));
    },
    'click .js-create-withdrawal' (event, instance) {
        let data = {savingAccDoc: state.get('savingAccDoc'),};
        alertify.savingTransaction(fa('plus', 'Saving Withdrawal'), renderTemplate(withdrawalFormTmpl, data));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            SavingTransaction,
            {_id: this._id},
            {title: 'SavingTransaction', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.savingTransactionShow(fa('eye', 'SavingTransaction'), renderTemplate(showTmpl, this));
    }
});

indexTmpl.onDestroyed(function () {
    Session.set('savingAccDoc', null);
});
