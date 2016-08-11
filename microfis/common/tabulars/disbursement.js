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
import {Disbursement} from '../../imports/api/collections/disbursement.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/disbursement.html');

tabularOpts.name = 'microfis.disbursement';
tabularOpts.collection = Disbursement;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_disbursementAction},
    {data: '_id', title: 'ID'},
    {data: 'productId', title: 'Product'},
    {
        data: 'disbursementDate',
        title: 'Dis Date',
        render: function (val, type, doc) {
            return moment(val).format('DD/MM/YYYY');
        }
    },
    {
        data: 'accountType',
        title: 'Acc Type',
        render: function (val, type, doc) {
            let iconType = 'user';
            if (val == 'GL') {
                iconType = 'users';
            }

            return Spacebars.SafeString(`<i class="fa fa-${iconType}"></i>`);
        }
    },
    // {data: 'currencyId', title: 'Currency',},
    {
        data: 'microfisAmount',
        title: 'Microfis Amount',
        render: function (val, type, doc) {
            return doc.currencyId + ' ' + numeral(val).format('0,0.00');
        }
    },
];
tabularOpts.extraFields = ['currencyId'];

export const DisbursementTabular = new Tabular.Table(tabularOpts);
