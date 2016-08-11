import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {SelectOpts} from '../../../ui/libs/select-opts.js';
import {SelectOptMethods} from '../../../../common/methods/select-opts.js';

export const RepaymentScheduleSchema = new SimpleSchema({
    clientId: {
        type: String,
        label: 'Client',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.client',
                optionsMethodParams: function () {
                    return Meteor.isClient && Session.get('currentBranch');
                }
            }
        }
    },
    disbursementId: {
        type: String,
        label: 'Disbursement ID',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search... (limit 10)',
                optionsPlaceholder: true,
                optionsMethod: 'microfis.selectOpts.disbursementByClient',
                optionsMethodParams: function () {
                    let clientId = AutoForm.getFieldValue('clientId');
                    return {clientId: clientId};
                }
            }
        }
    }
});
