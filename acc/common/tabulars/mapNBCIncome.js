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
import {MapNBCIncome} from '../../imports/api/collections/mapNBCIncome';


// Page
Meteor.isClient && require('../../imports/ui/pages/mapNBC/mapNBCIncome.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.mapNBCIncome',
    collection: MapNBCIncome,
    extraFields: ['chartAccountNBCId'],
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_mapNBCIncomeAction},
        {
            data: "accountDocNBC", title: "NBC Account",
            render: function (val, doc, type) {
                return val.code + " | " + val.name;
            }
        }
        ,
        {
            data: "transaction", title: "Chart Account",
            render: function (val, type, doc) {
                var str = "";
                val.forEach(function (obj) {
                    if (obj.accountDoc) {
                        str += obj.accountDoc.code + ' | ' + obj.accountDoc.name + "<br>";
                    }
                });
                return str;
            }
        }

    ]
})
export const MapNBCIncomeTabular = new Tabular.Table(tabularData);