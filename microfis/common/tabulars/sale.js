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
import {Sale} from '../../common/collections/sale';

// Page
Meteor.isClient && require('../../imports/pages/sale.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.sale',
    collection: Sale,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_saleAction},
        {data: 'saleDate', title: 'Sale Date',
            render: function (val, type, doc) {
                return moment(val).format('DD/MM/YYYY');
            }
        },
        {data: 'transactionType', title: 'Transaction Type'},
        /*{data: 'customerId', title: 'Customer Id'},
        {data: 'purchaseId', title: 'Purchase Id'},*/
        {data: 'price', title: 'Price',
            render:function (val,type,doc) {
                return numeral(val).format("(0,00.00)")
            }
        },
        {data: 'paid', title: 'Paid',
            render:function (val,type,doc) {
                return numeral(val).format("(0,00.00)")
            }},
        {data: 'remaining', title: 'Remain',
            render:function (val,type,doc) {
                return numeral(val).format("(0,00.00)")
            }},

    ],
    extraFields:["_id","purchaseId","customerId","loanAccId"]
});
export const SaleTabular = new Tabular.Table(tabularData);
