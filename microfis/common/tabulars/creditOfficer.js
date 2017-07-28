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
import {CreditOfficer} from '../../common/collections/credit-officer';

// Page
Meteor.isClient && require('../../imports/pages/credit-officer.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.creditOfficer',
    collection: CreditOfficer,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_creditOfficerAction},
        {data: '_id', title: 'ID'},
        {data: 'khName', title: 'Kh Name'},
        {data: 'enName', title: 'En Name'},
        {data: 'gender', title: 'Gender'},

        {data: 'telephone', title: 'Telephone'},
        {
            data: 'photo',
            title: 'Photo',
            render: function(value, object, doc) {
                if (value) {
                    let img = Files.findOne(value);
                    if (img) {
                        return Spacebars.SafeString(lightbox(img.url(), object._id, object.name));
                    }
                }

                return null;
            }
        }

    ],
    extraFields: ["dob", "address","email"]
});

export const CreditOfficerTabular = new Tabular.Table(tabularData);
