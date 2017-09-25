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
import {ClearPrepayTabular} from '../../common/tabulars/clearPrepay.js';
import {RepaymentTabular} from '../../common/tabulars/repayment.js';

// Collection
import {ClearPrepay} from '../../common/collections/clearPrepay.js';
import {Setting} from '../../../core/common/collections/setting';

// Page
import './clearPrepay.html';

// Declare template
let indexTmpl = Template.Microfis_clearPrepay,
    actionTmpl = Template.Microfis_clearPrepayAction,
    repaymentClearTmpl = Template.Microfis_repaymentClear,
    newTmpl = Template.Microfis_clearPrepayInsert;

let stateClearPrepay = new ReactiveObj();

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
                microfis_checkRepaymentExistOfClearPrepay
            }, 500)
            Session.set('isSuccess', undefined);
        }
    }
});


indexTmpl.onRendered(function () {
    createNewAlertify("clearPrepay");
})

indexTmpl.helpers({
    selector: function () {
        return {branchId: Session.get("currentBranch")};
    },
    tabularTable(){
        return ClearPrepayTabular;
    }
})

newTmpl.helpers({
    collection(){
        return ClearPrepay;
    }
});

repaymentClearTmpl.helpers({
    tabularTable() {
        let selector = {
            repaidDate: {$gte: moment(FlowRouter.getParam('closeDate'), "DD/MM/YYYY").toDate()},
            loanAccId: {$in: FlowRouter.getParam('loanAccIdList').split(",")},
            branchId: Session.get("currentBranch")
        };
        return {
            RepaymentTabular: RepaymentTabular,
            selector: selector
        };
    }
})


indexTmpl.events({
    'click .clearPrepay': function (e, t) {
        Session.set('isSave', undefined);
        Session.set('isSuccess', undefined);

        alertify.clearPrepay(fa("plus", "End Of Process"), renderTemplate(newTmpl));
    },
    'click .remove': function (e, t) {
        var id = this._id;
        let self = this;
        Meteor.call("microfis_checkRepaymentExistOfClearPrepay", self.detailPaid, self.closeDate, function (err, result) {
            if (result != undefined) {
                alertify.warning("Exist Repayment!!!");
                return false;
            }

            Meteor.call("microfis_getLastClearPrepay", self.branchId, function (err, result) {

                if (result) {
                    stateClearPrepay.set("closeDate", result.closeDate);
                }
                //Integrate to Account=============================================================================================================================
                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {
                    let selector = {};
                    selector.branchId = self.branchId;
                    Meteor.call('getDateEndOfProcess', selector, function (err, lastDateFromAccount) {

                        if (lastDateFromAccount == undefined || lastDateFromAccount.closeDate.getTime() < moment(self.closeDate).toDate().getTime()) {

                            if (moment(result.closeDate).toDate().getTime() > moment(self.closeDate).toDate().getTime()) {
                                alertify.error("Not the Last End OF Process!!!");
                            } else {
                                alertify.confirm("Are you sure to delete ?")
                                    .set({
                                        onok: function (closeEvent) {
                                            Meteor.call('microfis_removeClearPrepay', id, function (err, result) {
                                                if (!err) {
                                                    alertify.success('Success');
                                                }
                                            });
                                        },
                                        title: fa("remove", "End of Process")
                                    });
                            }
                        } else {
                            alertify.error("You already End OF Process in Accounting System!!!");
                        }
                    })
                    //=============================================================================================================================
                } else {
                    if (moment(result.closeDate).toDate().getTime() > moment(self.closeDate).toDate().getTime()) {
                        alertify.error("Not the Last End OF Process!!!");
                    } else {
                        alertify.confirm("Are you sure to delete ?")
                            .set({
                                onok: function (closeEvent) {
                                    Meteor.call('microfis_removeClearPrepay', id, function (err, result) {
                                        if (!err) {
                                            alertify.success('Success');
                                        }
                                    });
                                },
                                title: fa("remove", "End of Process")
                            });
                    }
                }
            });

        })
    },

    'dblclick tbody > tr': function (event) {
        let dataTable = $(event.target).closest('table').DataTable();
        let rowData = dataTable.row(event.currentTarget).data();
        Meteor.call("microfis_getloanAccIdList", rowData.detailPaid, rowData.closeDate, function (err, result) {
            if (result.length == 0) {
                alertify.success("Don't Have Repayment Clear Transaction");
                return false;
            }
            let params = {
                closeDate: moment(rowData.closeDate).format("DD/MM/YYYY"),
                loanAccIdList: result
            };
            FlowRouter.go('microfis.repaymentClear', params);
        })
    }
});

newTmpl.onRendered(function () {
    Meteor.call("microfis_getLastClearPrepay", function (err, result) {
        if (result) {
            stateClearPrepay.set("closeDate", result.closeDate);
        } else {
            stateClearPrepay.set("closeDate", undefined);
        }
    });
})

newTmpl.events({
    'click .save': function (e, t) {
        Session.set('isSave', true);
    },
    'click [name="closeDate"]'(e, t){
        let $closeDate = $('[name="closeDate"]');
        Meteor.call("microfis_getLastClearPrepay", Session.get('currentBranch'), function (err, result) {
            if (result.closeDate) {
                $closeDate.data("DateTimePicker").minDate(moment(result.closeDate).add(1, 'days').startOf('day').toDate());
            } else {
                $closeDate.data("DateTimePicker").minDate(moment().add(-200, 'years').startOf('day').toDate());
            }
        })
    }
})

newTmpl.onDestroyed(function () {
    AutoForm.resetForm("Microfis_clearPrepayInsert");
});


// Hook
let hooksObject = {
    onSuccess: function (formType, result) {

        Session.set('isSuccess', true)
        alertify.clearPrepay().close();
        alertify.success('Success');
    },
    onError: function (formType, error) {
        alertify.error("Duplicate Date");
    }
};

AutoForm.addHooks([
    'Microfis_clearPrepayInsert'
], hooksObject);
