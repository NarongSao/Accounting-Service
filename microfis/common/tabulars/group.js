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
import {Group} from '../../common/collections/group';

// Page
Meteor.isClient && require('../../imports/pages/group.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.group',
    collection: Group,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_groupAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Group Name'},
        {
            data: 'locationName', title: 'Location Name'
        }
    ],
    extraFields: ["locationId"]
});

export const GroupTabular = new Tabular.Table(tabularData);
