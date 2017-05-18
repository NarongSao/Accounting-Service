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
import {Group} from '../../common/collections/group';
// Tabular
import {GroupTabular} from '../../common/tabulars/group.js';
// Page
import  "./group.html"

// Declare template
let indexTmpl = Template.Microfis_group,
    actionTmpl = Template.Microfis_groupAction,
    newTmpl = Template.Microfis_groupNew,
    editTmpl = Template.Microfis_groupEdit,
    showTmpl = Template.Microfis_groupShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('group');
});

indexTmpl.helpers({
    tabularTable(){
        return GroupTabular;
    },
    tabularSelector(){
        return {branchId: Session.get('currentBranch')};
    },
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.group(fa('plus', 'Group'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.group(fa('pencil', 'Group'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Group,
            {_id: this._id},
            {title: 'Group', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.group(fa('eye', 'Group'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Group;
    }
});

newTmpl.onRendered(function () {
    this.autorun(function () {
        Meteor.call('locationForAppend', true, (err, result) => {
            if (result) {
                $('[name="locationId"]').select2({data: result});
            }
        });
    })
})

// Edit
editTmpl.helpers({
    collection(){
        return Group;
    }
});

editTmpl.onRendered(function () {
    this.autorun(function () {
        Meteor.call('locationForAppend', true, (err, result) => {
            if (result) {
                $('[name="locationId"]').select2({data: result});
            }
        });
    })
})
// Show
showTmpl.helpers({});

//Hook
AutoForm.hooks({
    Microfis_groupNew: {
        before: {
            insert: function (doc) {
                doc.locationName = $('[name="locationId"]').select2('data')[0].text;

                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.group().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
    , Microfis_groupEdit: {
        before: {
            update: function (doc) {

                doc.$set.locationName = $('[name="locationId"]').select2('data')[0].text;
                doc.$unset = {};
                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.group().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
});