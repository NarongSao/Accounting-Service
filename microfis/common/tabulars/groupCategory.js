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
import {GroupCategory} from '../../common/collections/groupCategory';

// Page
Meteor.isClient && require('../../imports/pages/groupCategory.html');

let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'microfis.groupCategory',
    collection: GroupCategory,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.Microfis_groupCategoryAction},
        {data: '_id', title: 'ID'},
        {data: 'name', title: 'Name'},
        {data: 'description', title: 'Description'}

    ],
    extraFields: ["numberUse"]
});

export const GroupCategoryTabular = new Tabular.Table(tabularData);
