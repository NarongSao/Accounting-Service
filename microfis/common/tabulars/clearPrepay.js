import {Meteor} from 'meteor/meteor';
import {Templet} from 'meteor/templating';
import Tabular from 'meteor/aldeed:tabular';
import {EJSON} from 'meteor/ejson';
import {moment} from 'meteor/momentjs:moment';
import {_} from 'meteor/erasaur:meteor-lodash';
import {numeral} from 'meteor/numeral:numeral';
import {lightbox} from 'meteor/theara:lightbox-helpers';

// Lib
import {tabularOpts} from '../../../core/common/libs/tabular-opts.js';

// Collection
import {ClearPrepay} from '../collections/clearPrepay';

// Page
Meteor.isClient && require('../../imports/pages/clearPrepay.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.clearPrepay',
    collection: ClearPrepay,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_clearPrepayAction},
        {data: '_id', title: 'Id'},
        {
            data: "closeDate", title: "Date",
            render: function (val, type, doc) {
                return moment(val).format("DD/MM/YYYY");
            }
        },
        {
            data: "createdBy", title: "User Create",
            render: function (val, type, doc) {
                let userName = Meteor.users.findOne({_id: val});
                if (userName) {
                    return userName.username;
                }
            }
        }

    ],
    extraFields: ['branchId', "detailPaid"],
    order: [[2, 'desc']],
});

export const ClearPrepayTabular = new Tabular.Table(tabularData);
