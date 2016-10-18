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
import {Location} from '../../common/collections/location.js';

// Tabular
import {LocationTabular} from '../../common/tabulars/location.js';

// Page
import './location.html';

// Declare template
let indexTmpl = Template.Microfis_location,
    actionTmpl = Template.Microfis_locationAction,
    newTmpl = Template.Microfis_locationNew,
    editTmpl = Template.Microfis_locationEdit,
    showTmpl = Template.Microfis_locationShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('location');
});

indexTmpl.helpers({
    tabularTable(){
        return LocationTabular;
    },
    tableSettings(){
        reactiveTableSettings.collection = 'microfis.reactiveTable.location';
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: 'ID',
                sortOrder: 0,
                sortDirection: 'asc'
            },
            {key: 'khName', label: 'Kh Name'},
            {key: 'enName', label: 'En Name'},
            {key: 'level', label: 'Level'},
            {
                key: 'parentDoc',
                label: 'Parent Doc',
                fn (value, object, key) {
                    if (object.level == 2) {
                        return `${value.khNamePro}`;
                    } else if (object.level == 3) {
                        return `${value.khNamePro}, ${value.khNameDis}`;
                    } else if (object.level == 4) {
                        return `${value.khNamePro}, ${value.khNameDis}, ${value.khNameCom}`;
                    }
                }
            },
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
        alertify.location(fa('plus', 'Location'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.location(fa('pencil', 'Location'), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Location,
            {_id: this._id},
            {title: 'Location', itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.location(fa('eye', 'Location'), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Location;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.location', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Location;
    },
    data () {
        let data = Location.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('microfis.location', {_id: this.data._id});
    });
});

showTmpl.helpers({
    data () {
        let data = Location.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.location().close();
        }
        $('[name="level"]').val(1);
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_locationNew',
    'Microfis_locationEdit'
], hooksObject);
