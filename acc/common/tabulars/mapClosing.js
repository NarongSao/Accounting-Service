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
import {MapClosing} from '../../imports/api/collections/mapCLosing.js';


// Page
Meteor.isClient && require('../../imports/ui/pages/mapClosing/mapCLosing.html');
let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.mapCLosing',
    collection: MapClosing,
    extraFields: ['chartAccount'],
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_mapClosingAction},
        {
            data: "_id",
            title: "Id"
        }, {
            data: "chartAccountCompare",
            title: "Compare Account"
        }, {
            data: "accountDoc",
            title: "Chart Account",
            render: function (val, type, doc) {
                if (val != undefined)
                    return result = val.code + " | " + val.name;
            }
        }

    ]
})
export const MapCLosingTabular = new Tabular.Table(tabularData);

