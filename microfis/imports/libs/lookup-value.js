import {Meteor} from  'meteor/meteor';
import {check} from  'meteor/check';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {LookupValue} from '../../common/collections/lookup-value.js';

export const lookupValue = function (name, opts = {}) {
    // Check params and set default val
    check(name, String);

    _.defaults(opts, {
        filterOpt: [],
        selectOne: true
    });

    let getLookup, list;
    getLookup = LookupValue.findOne({name: name});

    if (getLookup) {
        list = _.sortBy(getLookup.options, 'index');

        if (opts.filterOpt.length > 0) {
            list = _.chain(list)
                .filter(function (obj) {
                    return _.contains(opts.filterOpt, obj.value);
                })
                .map(function (obj) {
                    return obj;
                })
                .value();
        }

        // Check select one
        if (opts.selectOne) {
            list.unshift({label: '(Select One)', value: ''});
        }
    } else {
        list = [{label: 'Don\'t match', value: ''}];
    }
    
    return list;
};