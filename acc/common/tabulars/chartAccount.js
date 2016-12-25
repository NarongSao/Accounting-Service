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
import {ChartAccount} from '../../imports/api/collections/chartAccount.js';
import {AccountType} from '../../imports/api/collections/accountType.js';

// Page
Meteor.isClient && require('../../imports/ui/pages/chartAccount/chartAccount.html');
let tabularData = _.assignIn(_.clone(tabularOpts), {
    name: 'acc.chartAccount',
    collection: ChartAccount,
    columns: [
        {title: '<i class="fa fa-bars"></i>', tmpl: Meteor.isClient && Template.acc_chartAccountAction},
        {data: "_id", title: "ID"},
        {
            data: "code",
            title: "Code"
        }, {
            data: "name",
            title: "Name"
        }, {
            data: "parentId",
            title: "Parent",
            render: function (val, type, doc) {
                var result = "";
                if (val != null && val != "") {
                    re = ChartAccount.findOne({
                        _id: val
                    });
                    if (re) {
                        result = re.code + " | " + re.name;
                    }
                }
                return result;
            }
        },
        //{data: "accountTypeId", title: "Account Type"},
        {
            data: "accountTypeId",
            title: "Account Type",
            render: function (val, type, doc) {
                return AccountType.findOne({
                    _id: val
                }).name;
            }
        }
    ]
});
export const ChartAccountTabular = new Tabular.Table(tabularData);



