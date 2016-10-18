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
import {Location} from '../../common/collections/location.js';

// Page
Meteor.isClient && require('../../imports/pages/location.html');

tabularOpts.name = 'microfis.location';
tabularOpts.collection = Location;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_locationAction},
    {data: '_id', title: 'ID'},
    {data: 'khName', title: 'Kh Name'},
    {data: 'level', title: 'level'},
    {
        data: 'parentDoc',
        title: 'Parent Doc',
        render: function (val, type, doc) {
            if (doc.level == 2) {
                return `${val.khNamePro}`;
            } else if (doc.level == 3) {
                return `${val.khNamePro}, ${val.khNameDis}`;
            } else if (doc.level == 4) {
                return `${val.khNamePro}, ${val.khNameDis}, ${val.khNameCom}`;
            }
        }
    }
];
// tabularOpts.extraFields = ['parentId'];
export const LocationTabular = new Tabular.Table(tabularOpts);
