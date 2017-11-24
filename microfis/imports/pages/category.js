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

// Collection
import {Category} from '../../common/collections/category.js';

// Tabular
import {CategoryTabular} from '../../common/tabulars/category';
// Page
import './category.html';

// Declare template
let indexTmpl = Template.Microfis_category,
    actionTmpl = Template.Microfis_categoryAction,
    newTmpl = Template.Microfis_categoryNew,
    editTmpl = Template.Microfis_categoryEdit,
    showTmpl = Template.Microfis_categoryShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('category', {size: 'sm'});
    createNewAlertify('categoryShow');
});

indexTmpl.helpers({
    tabularTable(){
        return CategoryTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.category(fa('plus', 'Category'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.category(fa('pencil', 'Category'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        if(this.numberUse>0){
            alertify.error("Can remove");
        }else {
            destroyAction(
                Category,
                {_id: this._id},
             {title: 'Category', itemTitle: this._id}
            );
        }
    },
    'click .js-display' (event, instance) {
        alertify.categoryShow(fa('eye', 'Category'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Category;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return Category;
    }
});

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.category().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_categoryNew',
    'Microfis_categoryEdit'
], hooksObject);
