import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {SelectOpts} from '../../../imports/libs/select-opts.js';
import {SelectOptsReport} from '../../../imports/libs/select-opts.js';
import {SelectOptMethods} from '../../methods/select-opts.js';

export const RepaymentScheduleSchema = new SimpleSchema({
    clientId: {
        type: String,
        label: 'Client'
        ,
        autoform: {
            type: "select2",
            options: function () {
                return SelectOptsReport.client();
            }
        }

        /*,
         autoform: {
         type: 'universe-select',
         afFieldInput: {
         uniPlaceholder: 'Please search... (limit 10)',
         optionsPlaceholder: true,
         optionsMethod: 'microfis.selectOpts.client',
         optionsMethodParams: function () {
         return {branchId: Meteor.isClient && Session.get('currentBranch')};
         }
         }
         }*/
    },
    loanAccId: {
        type: String,
        label: 'Loan acc',


        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.loanAccByClient',
                optionsMethodParams: function () {
                    let clientId = AutoForm.getFieldValue('clientId');
                    return {clientId: clientId};
                }
            }
        }
    }
});
