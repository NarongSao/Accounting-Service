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
import {checkSavingTransaction} from '../../common/methods/check-saving-transaction';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction.js';

// Page
import './saving-transaction-deposit.html';

// Declare template
let formTmpl = Template.Microfis_savingTransactionDepositForm;

// State
let state = new ReactiveDict();

//-------- Form ------------
formTmpl.onCreated(function () {
    let currentData = Template.currentData(),
        savingAccDoc = currentData.savingAccDoc;

    // Set state
    state.setDefault({
        savingAccDoc: savingAccDoc,
        lastTransactionDate: savingAccDoc.accDate,
    });

    // Set min/max amount to simple schema
    let minMaxAmount;
    switch (savingAccDoc.currencyId) {
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
    Session.set('minAmount', minMaxAmount);

    // Track autorun
    this.autorun(function () {
        let transactionDate = state.get('transactionDate');

        if (transactionDate) {
                       $.blockUI({     overlayCSS: {         backgroundColor: '#fff',         opacity: 0.1,         cursor: 'wait'     } });

            // Call check repayment from method
            checkSavingTransaction.callPromise({
                savingAccId: savingAccDoc._id,
                checkDate: transactionDate
            }).then(function (result) {

                // Set state
                state.set('checkSavingTransaction', result);

                Meteor.setTimeout(()=> {
                    $.unblockUI();
                }, 100);

            }).catch(function (err) {
                console.log(err.message);
            });

        } else {
            state.set('checkSavingTransaction', null);
        }
    });

    // Get last repayment
    let lastTransaction = SavingTransaction.findOne({
        savingAccId: savingAccDoc._id
    }, {sort: {_id: -1}});
    if (lastTransaction) {
        state.set('lastTransactionDate', lastTransaction.transactionDate);
    }

});

formTmpl.onRendered(function () {
    let $transactionDateObj = $('[name="transactionDate"]');
    let transactionDate = moment($transactionDateObj.data("DateTimePicker").date()).toDate();

    state.set('transactionDate', transactionDate);

    // Repaid date picker
    $transactionDateObj.data("DateTimePicker").minDate(moment(state.get('lastTransactionDate')).startOf('day'));
    $transactionDateObj.on("dp.change", function (e) {
        state.set('transactionDate', moment(e.date).toDate());
    });
});

formTmpl.helpers({
    collection(){
        return SavingTransaction;
    },
    checkSavingTransaction(){
        return state.get('checkSavingTransaction');
    },
    jsonViewData(data){
        if (data) {
            data.transactionDate = moment(data.transactionDate).format('DD/MM/YYYY');
            return data;
        }
    },
    jsonViewOpts(){
        return {collapsed: true};
    }
});


formTmpl.onDestroyed(function () {
    Session.set('minAmount', null);
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let savingAccDoc = state.get('savingAccDoc'),
                checkSavingTransaction = state.get('checkSavingTransaction');

            // Cal principal bal
            checkSavingTransaction.principalBal = new BigNumber(checkSavingTransaction.principalOpening).plus(doc.amount).toNumber();

            // Remove last transaction
            delete checkSavingTransaction.lastTransaction;

            doc.transactionType = 'CD';
            doc.details = checkSavingTransaction;

            this.result(doc);
        }
    },
    onSuccess (formType, result) {
        alertify.savingTransaction().close();
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Microfis_savingTransactionDepositForm'], hooksObject);
