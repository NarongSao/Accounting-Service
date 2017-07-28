import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import Tabular from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {SavingAcc} from '../../common/collections/saving-acc';

// Page
Meteor.isClient && require('../../imports/pages/saving-acc.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.savingAcc',
    collection: SavingAcc,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_savingAccAction},
        {data: '_id', title: 'ID'},
        {data: 'productId', title: 'Product'},
        {
            data: 'accDate',
            title: 'Acc Date',
            render: function (val, type, doc) {
                return moment(val).format('DD/MM/YYYY');
            }
        },
        {data: 'accountType', title: 'Acc Type'},
        {data: 'savingLoanNumber', title: 'Saving Loan'},
        {data: 'status.value', title: 'Status'},
    ],

    extraFields: ['savingNumber'],
});

export const SavingAccTabular = new Tabular.Table(tabularData);
