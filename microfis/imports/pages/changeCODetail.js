import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

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
import {ChangeCO} from '../../common/collections/changeCO';


// Page
import './changeCODetail.html';
// Declare template
var changeCODetailTPL = Template.microfis_changeCODetail;


var changeCODetailCollection;
let locationOpt = new ReactiveVar([]);

//Created
changeCODetailTPL.onCreated(function () {
    let data = Template.currentData();
    changeCODetailCollection = data.changeCODetailCollection;
    changeCODetailCollection.remove({});

    if (data.location) {
        data.location.forEach(function (obj) {
            changeCODetailCollection.insert(obj);
        })
    }

    this.autorun(function () {
        Meteor.call('locationForReport', true, (err, result) => {
            locationOpt.set(result);
        });
    })
})

changeCODetailTPL.onRendered(function () {

})

/**
 * JournalDetail
 */
changeCODetailTPL.helpers({
    location () {
        let i = 1;
        let changeCO = changeCODetailCollection.find().fetch();
        changeCO.forEach(function (c) {
            c.index = i;
            i++;

        })
        return changeCO;
    },
    schema(){
        return ChangeCO.changeCODetail;
    },
    locationOpt(){

        return locationOpt.get();

    }
});

changeCODetailTPL.events({
    'click .addItem': function (e, t) {
        let location = {};
        location.locationId = t.$('[name="locationId"]').val();
        location.locationName = t.$('[name="locationId"] option:selected').text()

        let changeCO = changeCODetailCollection.findOne({locationId: location.locationId});
        if (!changeCO) {
            changeCODetailCollection.insert(location);
        }
    },
    'click .removeItem': function (e, t) {
        var self = this;
        changeCODetailCollection.remove(self._id);
    }
});




