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
import {Vendor} from '../../common/collections/vendor';

// Page
Meteor.isClient && require('../../imports/pages/vendor.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.vendor',
    collection: Vendor,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_vendorAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Name'},
        {data: 'address', title: 'Address'},
        {data: 'email', title: 'Email'},
        {data: 'tel', title: 'Telephone'},
        {data: 'description', title: 'Description'}
    ],
    extraFields: ["numberUse"]
});

export const VendorTabular = new Tabular.Table(tabularData);
