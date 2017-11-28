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
import {Purchase} from '../../common/collections/purchase';

// Page
Meteor.isClient && require('../../imports/pages/purchase.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.purchase',
    collection: Purchase,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_purchaseAction},
        {data: 'purchaseDate', title: 'Purchase Date',
            render: function (val, type, doc) {
                return moment(val).format('DD/MM/YYYY');
            }
        },
        {data: 'transactionType', title: 'Transaction Type'},
        // {data: 'vendorId', title: 'Vendor'},
        {data: 'itemName', title: 'Item Name'},
        // {data: 'category', title: 'Category'},
        // {data: 'group', title: 'Group'},
        {data: 'cost', title: 'Cost'},
        {data: 'price', title: 'Price'},
        {data: 'status', title: 'Status',
            render: function (val, type, doc) {
                if(val==true){
                    return `<span class="badge bg-green">${val}</span>`;
                }else {
                    return `<span class="badge bg-grey">${val}</span>`;
                }
            }}
    ],
    extraFields:["_id","vendorId","category","group"]
});
export const PurchaseTabular = new Tabular.Table(tabularData);
