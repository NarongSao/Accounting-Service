import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {lightbox} from 'meteor/theara:lightbox-helpers';

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
import {Guarantor} from '../../common/collections/guarantor.js';

// Page
import './guarantor.html';

// Declare template
let indexTmpl = Template.Microfis_guarantor,
    actionTmpl = Template.Microfis_guarantorAction,
    formTmpl = Template.Microfis_guarantorForm,
    showTmpl = Template.Microfis_guarantorShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('guarantor', {size: 'lg'});
    createNewAlertify('guarantorShow');
});

indexTmpl.helpers({
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.guarantor';
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'desc'
            },
            {key: 'khName', label: 'Kh Name'},
            {key: 'enName', label: 'En Name'},
            {key: 'gender', label: 'Gender'},
            {
                key: 'dob',
                label: 'Date of Birth',
                hidden: true,
                fn (value, object, key) {
                    return moment(value).format('DD/MM/YYYY');
                }
            },
            {key: 'address', label: 'Address', hidden: true},
            {key: 'telephone', label: 'Telephone'},
            {key: 'email', label: 'Email', hidden: true},
            {
                key: 'photo',
                label: 'Photo',
                fn(value, object, key) {
                    if (value) {
                        let img = Files.findOne(value);
                        if (img) {
                            return Spacebars.SafeString(lightbox(img.url(), object._id, object.name));
                        }
                    }

                    return null;
                }
            },
            {key: 'branchId', label: 'Branch', hidden: true},
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
        alertify.guarantor(fa('plus', 'Credit Officer'), renderTemplate(formTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.guarantor(fa('pencil', 'Credit Officer'), renderTemplate(formTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Guarantor,
            {_id: this._id},
            {title: 'Credit Officer', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.guarantorShow(fa('eye', 'Credit Officer'), renderTemplate(showTmpl, this));
    }
});

// Form
formTmpl.onCreated(function () {
    this.autorun(()=> {
        let currentData = Template.currentData();
        if (currentData) {
            this.subscribe('microfis.guarantor', {_id: currentData._id});
        }
    });
});

formTmpl.helpers({
    collection(){
        return Guarantor;
    },
    data () {
        let doc = {}, type = 'insert';
        let currentData = Template.currentData();
        if (currentData) {
            type = 'update';
            doc = Guarantor.findOne(currentData._id);
        }

        return {doc, type};
    }
});

// Show
showTmpl.helpers({
    data: function () {
        let data = this;
        data.photoUrl = null;
        if (data.photo) {
            let photo = Files.findOne(data.photo);
            data.photoUrl = photo.url();
        }

        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.guarantor().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_guarantorForm'
], hooksObject);
