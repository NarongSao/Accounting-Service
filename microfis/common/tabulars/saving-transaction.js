import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import moment from 'moment';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {SavingTransaction} from '../../imports/api/collections/saving-transaction';

// Page
Meteor.isClient && require('../../imports/ui/pages/saving-transaction.html');

tabularOpts.name = 'microfis.savingTransaction';
tabularOpts.collection = SavingTransaction;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_savingTransactionAction},
    {data: '_id', title: 'ID'},
    {
        data: 'transactionDate',
        title: 'Date',
        render: function (val, type, doc) {
            return moment(val).format('DD/MM/YYYY');
        }
    },
    {data: 'transactionType', title: 'Type'},
    {
        data: 'amount',
        title: 'Amount',
        render: function (val, type, doc) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: 'details.principalBal',
        title: 'Prin Bal',
        render: function (val, type, doc) {
            return numeral(val).format('0,0.00');
        }
    },
    {
        data: 'details.interestBal',
        title: 'Int Bal',
        render: function (val, type, doc) {
            return numeral(val).format('0,0.00');
        }
    },
    {data: 'voucherId', title: 'Vocher ID'},
];
tabularOpts.extraFields = ['savingAccId'];

export const SavingTransactionTabular = new Tabular.Table(tabularOpts);