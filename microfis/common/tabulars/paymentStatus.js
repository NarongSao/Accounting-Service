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
import {PaymentStatus} from '../../common/collections/paymentStatus.js';

// Page
Meteor.isClient && require('../../imports/pages/paymentStatus.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.paymentStatus',
    collection: PaymentStatus,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_paymentStatusAction},
        {data: '_id', title: 'ID'},
        {data: 'code', title: 'Code'},
        {data: 'name', title: 'Name'},
        {data: 'from', title: 'From (Days)'},
        {data: 'to', title: 'To (Days)'}

    ],
});

// tabularOpts.extraFields = ['parentId'];
export const PaymentStatusTabular = new Tabular.Table(tabularData);
