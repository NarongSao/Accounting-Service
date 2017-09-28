import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

import {updateLoanAccStatus} from '../../common/methods/update-LoanAccStatus.js'

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';
import {Setting} from '../../../core/common/collections/setting';

export const removeWaived = new ValidatedMethod({
        name: 'microfis.removeWaived',
        mixins: [CallPromiseMixin],
        validate: new SimpleSchema({
            loanAccId: {type: String},
            opts: {type: Object, optional: true, blackbox: true}
        }).validator(),
        run({loanAccId, opts}) {
            if (!this.isSimulation) {
                Meteor._sleepForMs(100);

                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {
                    Meteor.call("api_journalRemove", loanAccId, "Waived", function (err, result) {
                        if (err) {
                            console.log(err.message);
                        }
                    })
                }


                let isUpdate = LoanAcc.direct.update({_id: loanAccId}, {
                    $unset: opts
                },{multi: true});

                if (isUpdate) {
                    return updateLoanAccStatusWaived.callPromise({
                        loanAccId: loanAccId
                    }).then(function (result) {

                    }).catch(function (err) {
                        console.log(err.message);
                    });
                }


            }
        }
    })
;


export const updateLoanAccStatusWaived = new ValidatedMethod({
    name: 'microfis.updateLoanAccStatusWaived',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, opts}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);


            let doc = LoanAcc.findOne({_id: loanAccId});

            if (doc.waivedDate != null) {
                if (doc.restructureDate != null) {
                    if (doc.writeOffDate.getTime() > doc.restructureDate.getTime()) {

                        LoanAcc.direct.update({_id: loanAccId}, {
                            $set: {status: "Write Off"}
                        },{multi: true});

                    } else {

                        LoanAcc.direct.update({_id: loanAccId}, {
                            $set: {status: "Restructure"}
                        },{multi: true});
                    }
                } else {

                    LoanAcc.direct.update({_id: loanAccId}, {
                        $set: {status: "Write Off"}
                    },{multi: true});
                }
            } else if (doc.restructureDate != null) {
                LoanAcc.direct.update({_id: loanAccId}, {
                    $set: {status: "Restructure"}
                },{multi: true});
            } else {
                LoanAcc.direct.update({_id: loanAccId}, {
                    $set: {status: "Active"}
                },{multi: true});
            }
        }

    }

});