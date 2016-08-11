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
import {Client} from '../../imports/api/collections/client.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/client.html');

tabularOpts.name = 'microfis.client';
tabularOpts.collection = Client;
tabularOpts.columns = [
    {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_clientAction},
    {data: '_id', title: 'ID'},
    {data: 'khSurname', title: 'Kh Surname'},
    {data: 'khGivenName', title: 'Kh Given Name'},
    {data: 'gender', title: 'Gender'},
    {
        data: 'photo',
        title: 'Photo',
        render: function (val, type, doc) {
            if (val) {
                let img = Files.findOne(val);
                if (img) {
                    return Spacebars.SafeString(lightbox(img.url(), doc._id, doc.khGivenName));
                }
            }

            return null;
        }
    }
];
// tabularOpts.extraFields = ['parentId'];
export const ClientTabular = new Tabular.Table(tabularOpts);
