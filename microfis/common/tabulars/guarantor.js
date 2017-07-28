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
import {Guarantor} from '../../common/collections/guarantor';

// Page
Meteor.isClient && require('../../imports/pages/guarantor.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.guarantor',
    collection: Guarantor,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_guarantorAction},
        {data: '_id', title: 'Id'},
        {data: 'khName', title: 'Kh Name'},
        {data: 'enName', title: 'En Name'},
        {data: 'gender', title: 'Gender'},
        {
            data: 'dob',
            title: 'Date of Birth',
            render: function (val, type, doc) {
                return moment(val).format('DD/MM/YYYY');
            }
        },
        {data: 'telephone', title: 'Telephone'},
        {
            data: 'photo',
            title: 'Photo',
            render: function (value, object, doc) {
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
    extraFields: ["email", "branchId", "address"]
});

export const GuarantorTabular = new Tabular.Table(tabularData);
