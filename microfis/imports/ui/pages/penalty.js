import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {Penalty} from '../../api/collections/penalty.js';

// Page
import './penalty.html';

// Declare template
let indexTmpl = Template.Microfis_penalty,
    actionTmpl = Template.Microfis_penaltyAction,
    newTmpl = Template.Microfis_penaltyNew,
    editTmpl = Template.Microfis_penaltyEdit,
    showTmpl = Template.Microfis_penaltyShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('penalty');
});

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.penalty';
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'desc'
            },
            {key: 'name', label: 'Name'},
            {key: 'calculateType', label: 'Calculate Type'},
            {
                key: 'amount',
                label: 'Amount',
                fn (value, object, key) {
                    if (object.calculateType == 'A') {
                        return numeral(value).format('0,0.00');
                    }
                    return numeral(value / 100).format('0%');
                }
            },
            {key: 'graceDay', label: 'Grace Day'},
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
        ];

        return reactiveTableSettings;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.penalty(fa('plus', 'Penalty'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.penalty(fa('pencil', 'Penalty'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Penalty,
            {_id: this._id},
            {title: 'Penalty', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.penalty(fa('eye', 'Penalty'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Penalty;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.penalty', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Penalty;
    },
    data () {
        let data = Penalty.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.penalty', {_id: this.data._id});
    });
});

showTmpl.helpers({
    data () {
        let data = Penalty.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.penalty().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_penaltyNew',
    'Microfis_penaltyEdit'
], hooksObject);
