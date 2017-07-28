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
import {ChangeCO} from '../../common/collections/changeCO.js';
// Tabular
import {ChangeCOTabular} from '../../common/tabulars/changeCO.js';
// Page
import './changeCO.html';
import './changeCODetail';

// Declare template
let indexTmpl = Template.Microfis_changeCO,
    actionTmpl = Template.Microfis_changeCOAction,
    newTmpl = Template.Microfis_changeCONew,
    editTmpl = Template.Microfis_changeCOEdit,
    showTmpl = Template.Microfis_changeCOShow;


let changeCODetailCollection = new Mongo.Collection(null);
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify


    createNewAlertify('changeCO', {size: "md"});

});

indexTmpl.helpers({
    tabularTable(){
        return ChangeCOTabular;
    },
    tabularSelector(){
        return {branchId: Session.get('currentBranch')};
    },
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.changeCO(fa('plus', 'Change CO'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.changeCO(fa('pencil', 'Change CO'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            ChangeCO,
            {_id: this._id},
            {title: 'Change CO', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.changeCO(fa('eye', 'Change CO'), renderTemplate(showTmpl, this));
    }
});


// New
newTmpl.helpers({
    collection(){
        return ChangeCO;
    },

    changeCODetailCollection(){
        return changeCODetailCollection;
    }
});


// Edit
editTmpl.helpers({
    collection(){
        return ChangeCO;
    },
    changeCODetailCollection(){
        return changeCODetailCollection;
    }
});

// Show
showTmpl.helpers({});

//Hook
AutoForm.hooks({
    Microfis_changeCONew: {
        before: {
            insert: function (doc) {

                let locationData = changeCODetailCollection.find().fetch();

                let location = [];
                locationData.forEach(function (obj) {
                    location.push({locationId: obj.locationId, locationName: obj.locationName})
                });
                doc.location = location;

                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.changeCO().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
    , Microfis_changeCOEdit: {
        before: {
            update: function (doc) {

                let locationData = changeCODetailCollection.find().fetch();

                let location = [];
                locationData.forEach(function (obj) {
                    location.push({locationId: obj.locationId, locationName: obj.locationName})
                });
                doc.$set.location = location;
                doc.$unset = {};
                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.changeCO().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
});