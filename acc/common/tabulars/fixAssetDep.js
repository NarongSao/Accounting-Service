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
import {FixAssetDep} from '../../imports/api/collections/fixAssetDep';


// Page
Meteor.isClient && require('../../imports/ui/pages/fixAssetDep/fixAssetDep.html');
let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.fixAssetDep',
    collection: FixAssetDep,
    extraFields: ['journalId', '_id'],
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_fixAssetDepAction},
        {
            data: "date", title: "Date",
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY")
            }
        },
        {
            data: "transactionAsset", title: "Account",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += obj.account + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Description",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += obj.description + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Code",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += obj.code + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Value",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += numeral(obj.value).format("(0,00.00)") + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Life",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += obj.life + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Salvage",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += numeral(obj.estSalvage).format("(0,00.00)") + "<br>";
                })
                return exp;
            }
        }, {
            data: "transactionAsset", title: "Percent",
            render: function (val, type, doc) {
                var exp = "";
                val.forEach(function (obj) {
                    exp += obj.percent + "<br>";
                })
                return exp;
            }
        },

        {data: "currencyId", title: "Currency"}
    ]
})
export const FixAssetDepTabular = new Tabular.Table(tabularData);




