import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {Template} from 'meteor/templating';
import {Tabular} from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {SavingAcc} from '../../imports/api/collections/saving-acc';

// Page
Meteor.isClient && require('../../imports/ui/pages/saving-acc.html');

tabularOpts.name = 'microfis.savingAcc';
tabularOpts.collection = SavingAcc;
tabularOpts.columns = [
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
];
// tabularOpts.extraFields = ['parentId'];
export const SavingAccTabular = new Tabular.Table(tabularOpts);
