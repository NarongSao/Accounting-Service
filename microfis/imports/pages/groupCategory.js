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
import {GroupCategory} from '../../common/collections/groupCategory.js';

// Tabular
import {GroupCategoryTabular} from '../../common/tabulars/groupCategory';
// Page
import './groupCategory.html';

// Declare template
let indexTmpl = Template.Microfis_groupCategory,
    actionTmpl = Template.Microfis_groupCategoryAction,
    newTmpl = Template.Microfis_groupCategoryNew,
    editTmpl = Template.Microfis_groupCategoryEdit,
    showTmpl = Template.Microfis_groupCategoryShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('groupCategory', {size: 'sm'});
    createNewAlertify('groupCategoryShow');
});

indexTmpl.helpers({
    tabularTable(){
        return GroupCategoryTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.groupCategory(fa('plus', 'GroupCategory'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.groupCategory(fa('pencil', 'GroupCategory'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            GroupCategory,
            {_id: this._id},
            {title: 'GroupCategory', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.groupCategoryShow(fa('eye', 'GroupCategory'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return GroupCategory;
    }
});

// Edit
editTmpl.helpers({
    collection(){
        return GroupCategory;
    }
});

// Show
showTmpl.helpers({});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.groupCategory().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_groupCategoryNew',
    'Microfis_groupCategoryEdit'
], hooksObject);
