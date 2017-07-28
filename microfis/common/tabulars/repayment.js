import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import Tabular from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import moment from 'moment';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

// Page
Meteor.isClient && require('../../imports/pages/repayment.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.repayment',
    collection: Repayment,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_repaymentAction},
        {data: '_id', title: 'ID'},
        {
            data: 'repaidDate',
            title: 'Repaid Date',
            render: function (val, type, doc) {
                return moment(val).format('DD/MM/YYYY');
            }
        },
        {data: 'type', title: 'Type'},
        {
            data: 'voucherId', title: 'Voucher',
            render: function (value, object, key) {
                return value.substr(8, value.length - 1);
            }
        },
        {
            data: 'detailDoc.totalSchedulePaid.totalPrincipalInterestDue',
            title: 'Amount Due',
            render: function (val, type, doc) {
                return numeral(val).format('0,0.00');
            }
        },
        {
            data: 'detailDoc.totalSchedulePaid.penaltyDue',
            title: 'Penalty Due',
            render: function (val, type, doc) {
                return numeral(val).format('0,0.00');
            }
        },
        {
            data: 'amountPaid',
            title: 'Amount Paid',
            render: function (val, type, doc) {
                return numeral(val).format('0,0.00');
            }
        },
        {
            data: 'penaltyPaid',
            title: 'Penalty Paid',
            render: function (val, type, doc) {
                return numeral(val).format('0,0.00');
            }
        },
        {
            data: 'detailDoc.totalSchedulePaid.totalPrincipalInterestBal',
            title: 'Overdue Amount',
            render: function (val, type, doc) {
                if (val > 0) {
                    return Spacebars.SafeString('<span class="text-red">' + numeral(val).format('0,0.00') + '</span>');
                }
                return numeral(val).format('0,0.00');
            }
        }
    ],
    extraFields: ['disbursementId', 'amountType', "loanAccId", "endId"],
});

export const RepaymentTabular = new Tabular.Table(tabularData);
