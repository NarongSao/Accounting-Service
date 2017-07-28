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
import {GroupLoan} from '../../common/collections/groupLoan';

// Page
Meteor.isClient && require('../../imports/pages/groupLoan.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.groupLoan',
    collection: GroupLoan,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_groupLoanAction},
        {data: '_id', title: 'ID'},
        {data: 'groupName', title: 'Group Name'},
        {data: 'code', title: 'Code'},
        {
            data: 'date', title: 'Date',
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY");
            }
        },

        {
            data: 'loan', title: 'Loan Account',
            render: function (val, type, doc) {

                var str = "";
                if (val) {
                    val.forEach(function (obj) {
                        if (obj) {
                            str += obj.id + "<br>";
                        }
                    });
                }
                return str;
            }
        }
    ],
    extraFields: ["groupId"]
});

export const
    GroupLoanTabular = new Tabular.Table(tabularData);
