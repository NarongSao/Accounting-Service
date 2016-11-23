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
import {Closing} from '../../imports/api/collections/closing.js';

// Page
Meteor.isClient && require('../../imports/ui/reports/currencyClosing/currencyClosing.html');
let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.closing',
    collection: Closing,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_closingAction},
        {data: "_id", title: "ID"},
        {
            data: "dateFrom", title: "Date From",
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY");
            }
        },
        {
            data: "dateTo", title: "Date To",
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY");
            }
        }
    ]
})
export const ClosingAccountTabular = new Tabular.Table(tabularData);



