import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {TAPi18n} from 'meteor/tap:i18n';

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
import {Setting} from '../../common/collections/setting.js';

// Page
import './setting.html';

// Declare template
var indexTmpl = Template.Microfis_setting;

// Index
indexTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.setting');
    });
});

indexTmpl.helpers({
    collection(){
        return Setting;
    },
    data: function () {
        return Setting.findOne();
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_setting'
], hooksObject);
