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
import {GroupLoan} from '../../common/collections/groupLoan';


// Page
import './groupLoanDetail.html';
// Declare template
var groupLoanDetailTPL = Template.microfis_groupLoanDetail;


var groupLoanDetailCollection;
clientAccOpt = new ReactiveVar([]);
clientAccOptTmp = new ReactiveVar([]);
locationChange = new ReactiveVar("");

//Created
groupLoanDetailTPL.onCreated(function () {
    let data = Template.currentData();
    groupLoanDetailCollection = data.groupLoanDetailCollection;
    groupLoanDetailCollection.remove({});

    if (data.loan) {
        locationChange.set(data.locationId);
        data.loan.forEach(function (obj) {
            groupLoanDetailCollection.insert(obj);
        })
    }


})

groupLoanDetailTPL.onRendered(function () {
    this.autorun(function () {
        Meteor.call("microfis_clientAccGroupOpt", Session.get("currentBranch"), locationChange.get(), function (err, result) {
            if (result) {
                clientAccOpt.set(result);
            }
        })
        Meteor.call("microfis_clientAccAllGroupOpt", Session.get("currentBranch"), locationChange.get(), function (err, result) {
            if (result) {
                clientAccOptTmp.set(result);
            }
        })
    })
})

/**
 * JournalDetail
 */
groupLoanDetailTPL.helpers({
    loan () {
        let i = 1;
        let groupLoan = groupLoanDetailCollection.find().fetch();
        groupLoan.forEach(function (c) {
            c.index = i;
            i++;

        })
        return groupLoan;
    },
    schema(){
        return GroupLoan.groupLoanDetail;
    },
    clientAccOpt(){
        return clientAccOpt.get();
    }
});

groupLoanDetailTPL.events({
    'click .addItem': function (e, t) {

        let loan = {};
        loan.id = t.$('[name="loanAccount"]').val();
        if (loan.id == "") {
            alertify.warning("Need to Choose!!!");
            return false;
        }
        groupLoanDetailCollection.insert(loan);

        // let index = clientAccOpt.get().findIndex(x => x.value == loan.id);

        // delete clientAccOpt.get()[index];

        let newArrayClientOpt = clientAccOpt.get().filter(function (obj) {
            return obj.value !== loan.id;
        });

        clientAccOpt.set(newArrayClientOpt);

    },
    'click .removeItem': function (e, t) {
        debugger;
        let self = this;
        groupLoanDetailCollection.remove(self._id);
        let tmpCollection = groupLoanDetailCollection.find().fetch().map(function (obj) {
            return obj.id;
        })

        let newArrayClientOpt = clientAccOptTmp.get().filter(function (obj) {
            return tmpCollection.indexOf(obj.value) <= -1;
        });

        clientAccOpt.set(newArrayClientOpt);
    }
});




