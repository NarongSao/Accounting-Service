import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

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
import '../../../core/client/components/add-new-button.js';

// Collection
import {Fee} from '../../common/collections/fee.js';

// Page
import './fee.html';

// Declare template
let indexTmpl = Template.Microfis_fee,
    actionTmpl = Template.Microfis_feeAction,
    newTmpl = Template.Microfis_feeNew,
    editTmpl = Template.Microfis_feeEdit,
    showTmpl = Template.Microfis_feeShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('fee');
});

let stateFee = new ReactiveObj();

indexTmpl.helpers({
    tableSettings(){
        let reactiveTableData = _.assignIn(_.clone(reactiveTableSettings), {
            collection: 'microfis.reactiveTable.fee',
            fields: [
                {
                    key: '_id',
                    label: 'ID',
                    sortOrder: 0,
                    sortDirection: 'desc'
                },
                {key: 'name', label: 'Name'},
                {key: 'calculateType', label: 'Calculate Type'},
                {key: 'feeTypeOf', label: 'Fee Type'},
                {
                    key: 'amount',
                    label: 'Amount',
                    fn (value, object, key) {
                        if (object.calculateType == 'A') {
                            return numeral(value).format('0,0.00');
                        }
                        return numeral(value / 100).format('0.00%');
                    }
                },
                {key: 'numberOfProduct', label: 'Number'},

                {
                    key: '_id',
                    label(){
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
    'click .js-create' (event, instance) {
        stateFee.set('isFeeTypeOf', false);
        alertify.fee(fa('plus', 'Fee'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        stateFee.set('isFeeTypeOf', false);
        if (this.calculateType == "P") {
            stateFee.set('isFeeTypeOf', true);
        } else {
            stateFee.set('isFeeTypeOf', false);
        }
        alertify.fee(fa('pencil', 'Fee'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        if (this.numberOfProduct <= 0) {
            destroyAction(
                Fee,
                {_id: this._id},
                {title: 'Fee', itemTitle: this._id}
            );
        } else {
            alertify.warning("Already have relation with product");
        }
    },
    'click .js-display' (event, instance) {
        alertify.fee(fa('eye', 'Fee'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Fee;
    },
    isFeeTypeOf(){
        return stateFee.get("isFeeTypeOf");
    }
});

newTmpl.events({
    'change [name="calculateType"]'(e, t){
        if (e.currentTarget.value == "P") {
            stateFee.set('isFeeTypeOf', true);
        } else {
            stateFee.set('isFeeTypeOf', false);
        }
    }
})

// Edit
editTmpl.helpers({
    collection(){
        return Fee;
    },
    isFeeTypeOf(){
        return stateFee.get("isFeeTypeOf");
    }
});

editTmpl.events({
    'change [name="calculateType"]'(e, t){
        if (e.currentTarget.value == "P") {
            stateFee.set('isFeeTypeOf', true);
        } else {
            stateFee.set('isFeeTypeOf', false);
        }
    }
})


// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.fee().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_feeNew',
    'Microfis_feeEdit'
], hooksObject);
