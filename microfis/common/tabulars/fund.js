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
import {Fund} from '../../common/collections/fund';

// Page
Meteor.isClient && require('../../imports/pages/fund.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.fund',
    collection: Fund,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_fundAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Name'},
        {
            data: 'registerDate',
            title: 'Register Date',
            render: function (value, object, data) {
                return moment(value).format('DD/MM/YYYY');
            }
        },
        {data: 'telephone', title: 'Telephone'},
        {data: 'email', title: 'email'}

    ],
    extraFields: ["address", "website", "shortName"]
});

export const FundTabular = new Tabular.Table(tabularData);
