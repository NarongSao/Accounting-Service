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
import './saving-transaction-withdrawal.html';

// Declare template
let formTmpl = Template.Microfis_savingTransactionWithdrawalForm;

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
            $.blockUI();

            // Call check repayment from method
            checkSavingTransaction.callPromise({
                savingAccId: savingAccDoc._id,
                checkDate: transactionDate
            }).then(function (result) {
                console.log(result);

                // Set state
                state.set('checkSavingTransaction', result);

                // Set max amount
                Session.set('maxAmount', new BigNumber(result.principalOpening).plus(result.interestBal).toNumber());

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
        let data = state.get('checkSavingTransaction');
        if (data) {
            data.totalBal = new BigNumber(data.principalOpening).plus(data.interestBal).toNumber();
        }

        return data;
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

            doc.amount = doc.amount ? doc.amount : 0;

            // Cal principal, interest bal
            let amount = new BigNumber(doc.amount);
            if (amount.lessThanOrEqualTo(checkSavingTransaction.interestBal)) {
                checkSavingTransaction.interestBal = new BigNumber(checkSavingTransaction.interestBal).minus(doc.amount).toNumber();
                checkSavingTransaction.principalBal = new BigNumber(checkSavingTransaction.principalOpening).toNumber();
            } else {
                amount = amount.minus(checkSavingTransaction.interestBal);
                checkSavingTransaction.interestBal = new BigNumber(0).toNumber();
                checkSavingTransaction.principalBal = new BigNumber(checkSavingTransaction.principalOpening).minus(amount).toNumber();
            }

            // Remove last transaction
            delete checkSavingTransaction.lastTransaction;

            doc.transactionType = 'CW';
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
AutoForm.addHooks(['Microfis_savingTransactionWithdrawalForm'], hooksObject);
