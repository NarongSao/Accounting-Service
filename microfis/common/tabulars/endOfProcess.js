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
import {EndOfProcess} from '../collections/endOfProcess.js';

// Page
Meteor.isClient && require('../../imports/pages/endOfProcess.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.endOfProcess',
    collection: EndOfProcess,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_endOfProcessAction},
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
        ,
        {data: 'status', title: 'Status',
            render: function (val, type, doc) {
                if (val == true) {
                    return `<button type="button" class="btn btn-success btn-lg"><span class="glyphicon glyphicon-ok"></span></button>`
                } else {
                    return `<button class="btn btn-lg btn-warning"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...</button>`
                }
            }}
    ],


    extraFields: ['branchId'],
    order: [[2, 'desc']],
});

export const EndOfProcessTabular = new Tabular.Table(tabularData);
