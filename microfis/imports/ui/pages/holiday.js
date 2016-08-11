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
import {Holiday} from '../../api/collections/holiday.js';

// Page
import './holiday.html';

// Declare template
let indexTmpl = Template.Microfis_holiday,
    actionTmpl = Template.Microfis_holidayAction,
    newTmpl = Template.Microfis_holidayNew,
    editTmpl = Template.Microfis_holidayEdit,
    showTmpl = Template.Microfis_holidayShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('holiday');
});

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.holiday';
        reactiveTableSettings.fields = [
            {
                key: 'from',
                label: 'From',
                sortOrder: 0,
                sortDirection: 'desc',
                fn (value, object, key) {
                    return moment(value).format('DD/MM/YYYY');
                }
            },
            {
                key: 'to',
                label: 'To',
                fn (value, object, key) {
                    return moment(value).format('DD/MM/YYYY');
                }
            },
            {key: 'name', label: 'Name'},
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
        alertify.holiday(fa('plus', 'Holiday'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.holiday(fa('pencil', 'Holiday'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Holiday,
            {_id: this._id},
            {title: 'Holiday', itemTitle: this.name}
        );
    },
    'click .js-display' (event, instance) {
        alertify.holiday(fa('eye', 'Holiday'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Holiday;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.holiday', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Holiday;
    },
    data () {
        let data = Holiday.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.holiday', {_id: this.data._id});
    });
});

showTmpl.helpers({
    data () {
        let data = Holiday.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.holiday().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_holidayNew',
    'Microfis_holidayEdit'
], hooksObject);
