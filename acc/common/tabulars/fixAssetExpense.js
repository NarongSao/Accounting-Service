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
import {FixAssetExpense} from '../../imports/api/collections/fixAssetExpense';


// Page
Meteor.isClient && require('../../imports/ui/pages/fixAssetExpense/fixAssetExpense.html');
let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.fixAssetExpense',
    extraFields: ['journalId', '_id'],
    collection: FixAssetExpense,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_fixAssetExpenseAction},
        {
            data: "date", title: "Date",
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY")
            }
        },
        {
            data: "transactionExpense", title: "Depreciation Expense",
            render: function (val, type, doc) {
                var exp = "";
                if (val != undefined) {
                    val.forEach(function (obj) {
                        exp += moment(obj.buyDate).format("DD/MM/YYYY") + "    :     " + obj.account + "  :  <b>" + obj.value + obj.currencyId + "</b><br>"
                    })
                }
                return exp;
            }
        },

        {
            data: "createdBy", title: "User Create",
            render: function (val, type, doc) {
                return Meteor.users.findOne({_id: val}).username;
            }
        }
    ]
})
export const FixAssetExpenseTabular = new Tabular.Table(tabularData);




