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
import {MapFixAsset} from '../../imports/api/collections/mapFixAsset';


// Page
Meteor.isClient && require('../../imports/ui/pages/mapFixAsset/mapFixAsset.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.mapFixAsset',
    collection: MapFixAsset,
    extraFields: ['fixAsset', 'accuFixAsset', 'fixAssetExpense'],
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_mapFixAssetAction},
        {
            data: "fixAssetDoc.name",
            title: "FixAsset"
        }, {
            data: "accuFixAssetDoc.name",
            title: "FixAsset Accumulated"
        }, {
            data: "fixAssetExpenseDoc.name",
            title: "FixAsset Expense"
        }

    ]
})
export const MapFixAssetTabular = new Tabular.Table(tabularData);


