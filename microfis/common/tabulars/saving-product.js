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
import {SavingProduct} from '../../common/collections/saving-product';

// Page
Meteor.isClient && require('../../imports/pages/saving-product.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.savingProduct',
    collection: SavingProduct,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_savingProductAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Name'},
        {data: 'accountType', title: 'Acc Type'},
        // {data: 'operationType', title: 'Operation Type'},
        {data: 'currencyId', title: 'Currency'},
        {data: 'accountClass', title: 'Acc Class'},
        {data: 'interestMethod', title: 'Method'},
        {
            data: 'interestRate',
            title: 'Rate',
            render: function (val, type, doc) {
                return EJSON.stringify(val);
            }
        }
    ],
});

export const SavingProductTabular = new Tabular.Table(tabularData);
