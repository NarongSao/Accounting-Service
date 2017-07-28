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
import {ProductStatus} from '../../common/collections/productStatus';

// Page
Meteor.isClient && require('../../imports/pages/productStatus.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.productStatus',
    collection: ProductStatus,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_productStatusAction},
        {data: '_id', title: 'ID'},
        {data: 'code', title: 'Code'},
        {data: 'name', title: 'Name'},
        {data: 'type', title: 'Type'},
        {data: 'from', title: 'From (Days)'},
        {data: 'to', title: 'To (Days)'},
        {data: 'provision', title: 'Provision(%)'}

    ],
});

// tabularOpts.extraFields = ['parentId'];
export const ProductStatusTabular = new Tabular.Table(tabularData);
