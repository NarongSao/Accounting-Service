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
import {Client} from '../../common/collections/client.js';

// Tabular
import {ClientTabular} from '../../common/tabulars/client.js';

// Page
import './client.html';

// Declare template
let indexTmpl = Template.Microfis_client,
    actionTmpl = Template.Microfis_clientAction,
    formTmpl = Template.Microfis_clientForm,
    showTmpl = Template.Microfis_clientShow;

stateClient = new ReactiveObj();
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('client', {size: 'lg'});
    createNewAlertify('clientShow');

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('microfis.clientByBranch', ['branchId']);
    this.autorun(()=> {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.helpers({
    tabularTable(){
        return ClientTabular;
    },
    tabularSelector(){
        return {branchId: Session.get('currentBranch')};
    },
    tableSettings(){
        let reactiveTableData = _.assignIn(_.clone(reactiveTableSettings), {
            class: 'table table-striped table-bordered table-condensed table-hover-pointer',
            collection: 'microfis.reactiveTable.client',
            filters: ['microfis.clientByBranch'],
            fields: [
                {
                    key: '_id',
                    label: 'ID',
                    sortOrder: 0,
                    sortDirection: 'desc'
                },
                {key: 'prefix', label: 'Prefix', hidden: true},
                {key: 'khSurname', label: 'Kh Surname'},
                {key: 'khGivenName', label: 'Kh Given Name'},
                {key: 'khNickname', label: 'Kh Nickname', hidden: true},
                {key: 'enSurname', label: 'En Surname', hidden: true},
                {key: 'enGivenName', label: 'En Given Name', hidden: true},
                {key: 'enNickname', label: 'En Nickname', hidden: true},
                {key: 'gender', label: 'Gender'},
                {
                    key: 'dob',
                    label: 'Date of Birth',
                    hidden: true,
                    fn (value, object, key) {
                        return moment(value).format('DD/MM/YYYY');
                    }
                },
                {key: 'maritalStatus', label: 'Marital Status', hidden: true},
                {key: 'branchId', label: 'Branch', hidden: true},
                {key: 'idType', label: 'ID Type'},
                {key: 'idNumber', label: 'ID Num'},
                {key: 'idExpiryDate', label: 'ID Expiry Date', hidden: true},
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
            ],
        });

        return reactiveTableData;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.client(fa('plus', 'Client'), renderTemplate(formTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.client(fa('pencil', 'Client'), renderTemplate(formTmpl, this)).maximize();
    },
    'click .js-destroy' (event, instance) {
        if (this.cycle > 0) {
            alertify.error("You already have loan account!!!");
        } else {
            destroyAction(
                Client,
                {_id: this._id},
                {title: 'Client', itemTitle: this._id}
            );
        }

    },
    'click .js-display' (event, instance) {
        alertify.clientShow(fa('eye', 'Client'), renderTemplate(showTmpl, this));
    },
    'dblclick tbody > tr': function (event) {

        var dataTable = $(event.target).closest('table').DataTable();
        var rowData = dataTable.row(event.currentTarget).data();

        stateClient.set('cycle', rowData.cycle);

        FlowRouter.go('microfis.clientAcc', {clientId: rowData._id});
    }
});

indexTmpl.onDestroyed(function () {
    ReactiveTable.clearFilters(['microfis.clientByBranch']);
});

// Form
formTmpl.onCreated(function () {
    this.autorun(()=> {
        let currentData = Template.currentData();
        if (currentData) {
            this.subscribe('microfis.clientById', currentData._id);
        }
    });
});

formTmpl.helpers({
    collection(){
        return Client;
    },
    data(){
        let currentData = Template.currentData();
        if (currentData) {
            return Client.findOne({_id: currentData._id});
        }
    },
    formType () {
        let updateDoc = this;
        if (updateDoc._id) {
            return 'update'
        }

        return 'insert';
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        let currentData = Template.currentData();
        if (currentData) {
            this.subscribe('microfis.clientById', currentData._id);
        }
    });
});

showTmpl.helpers({
    data(){
        let currentData = Template.currentData();
        let data = Client.findOne({_id: currentData._id});
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
            alertify.client().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Microfis_clientForm'
], hooksObject);