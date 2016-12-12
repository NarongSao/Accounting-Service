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


// Tabular
import {EndOfProcessTabular} from '../../common/tabulars/endOfProcess.js';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';

// Page
import './endOfProcess.html';

// Declare template
let indexTmpl = Template.Microfis_endOfProcess,
    actionTmpl = Template.Microfis_endOfProcessAction,
    newTmpl = Template.Microfis_endOfProcessInsert;

let stateEndOfProcess = new ReactiveObj();

Tracker.autorun(function () {
    if (Session.get('isSave')) {
        swal({
            title: "Pleas Wait",
            text: "Ending Process....",
            showConfirmButton: false
        })

        // swal("End Process!", "Your Process has been ended.", "success");
        if (Session.get('isSuccess')) {
            setTimeout(function () {
                swal.close();
            }, 500)
            Session.set('isSuccess', undefined);
        }
    }
});


indexTmpl.onRendered(function () {
    createNewAlertify("endOfProcess");
})

indexTmpl.helpers({
    selector: function () {
        return {branchId: Session.get("currentBranch")};
    },
    tabularTable(){
        return EndOfProcessTabular;
    }
})

newTmpl.helpers({
    collection(){
        return EndOfProcess;
    }
});


indexTmpl.events({
    'click .endOfProcess': function (e, t) {

        Session.set('isSave', undefined);
        Session.set('isSuccess', undefined);

        alertify.endOfProcess(fa("plus", "End Of Process"), renderTemplate(newTmpl));
    },
    'click .remove': function (e, t) {
        var id = this._id;
        let self = this;

        Meteor.call("microfis_getLastEndOfProcess", function (err, result) {
            if (result) {
                stateEndOfProcess.set("closeDate", result.closeDate);
            }
            if (moment(result.closeDate).toDate().getTime() != moment(self.closeDate).toDate().getTime()) {
                alertify.error("Not the Last End OF Process!!!");
            } else {
                alertify.confirm("Are you sure to delete ?")
                    .set({
                        onok: function (closeEvent) {
                            Meteor.call('microfis_removeEndOfProcess', id, function (err, result) {
                                if (!err) {
                                    alertify.success('Success');
                                }
                            });
                        },
                        title: fa("remove", "End of Process")
                    });
            }

        });

    }
});

newTmpl.onRendered(function () {
    Meteor.call("microfis_getLastEndOfProcess", function (err, result) {
        if (result) {
            stateEndOfProcess.set("closeDate", result.closeDate);
        } else {
            stateEndOfProcess.set("closeDate", undefined);
        }
    });
})

newTmpl.events({
    'click .save': function (e, t) {
        Session.set('isSave', true);
    },
    'click [name="closeDate"]'(e, t){
        let $closeDate = $('[name="closeDate"]');
        if (stateEndOfProcess.get("closeDate")) {
            $closeDate.data("DateTimePicker").minDate(moment(stateEndOfProcess.get("closeDate")).add(1, 'days').startOf('day').toDate());
        } else {
            $closeDate.data("DateTimePicker").minDate(moment().add(-200, 'years').startOf('day').toDate());

        }
    }
})

newTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_endOfProcessInsert");
});


// Hook
let hooksObject = {
    onSuccess: function (formType, result) {

        Session.set('isSuccess', true)
        alertify.endOfProcess().close();
        alertify.success('Success');
    },
    onError: function (formType, error) {
        alertify.error("Duplicate Date");
    }
};

AutoForm.addHooks([
    'Microfis_endOfProcessInsert'
], hooksObject);
