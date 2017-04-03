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
import {ChangeCO} from '../../common/collections/changeCO';

// Page
Meteor.isClient && require('../../imports/pages/changeCO.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.changeCO',
    collection: ChangeCO,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_changeCOAction},
        {data: '_id', title: 'ID'},
        {
            data: 'date', title: 'Date',
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY");
            }
        },
        {
            data: 'fromCODoc', title: 'From CO',
            render: function (val, type, doc) {
                if (val) {
                    return val._id + " " + val.khName;
                }
            }
        },
        {
            data: 'toCODoc', title: 'To CO',
            render: function (val, type, doc) {
                if (val) {
                    return val._id + " " + val.khName;
                }
            }
        },
        {
            data: 'location', title: 'Location',
            render: function (val, type, doc) {
                var str = "";
                if (val) {
                    val.forEach(function (obj) {
                        if (obj.locationName) {
                            str += obj.locationName + "<br>";
                        }
                    });
                }
                return str;
            }
        },
        {data: 'description', title: 'Description'},

    ],
    extraFields: ["fromCO", "toCO"]
});

export const ChangeCOTabular = new Tabular.Table(tabularData);
