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
import {Product} from '../../common/collections/product';

// Page
Meteor.isClient && require('../../imports/pages/product.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.product',
    collection: Product,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_productAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Name'},
        // Account
        {data: 'accountType', title: 'Account Type'},
        {data: 'currencyId', title: 'Currency'},

        // Payment
        {data: 'paymentMethod', title: 'Payment Method'},

        // Interest
        {data: 'interestMethod', title: 'Interest Method'},


    ],
    extraFields: ["shortName", "des", "startDate", "endDate", "exchange", "loanAmount", "term", "interestRate", "feeId", "penaltyId", "penaltyClosingId", "feeOnPaymentId"]
});

export const ProductTabular = new Tabular.Table(tabularData);
