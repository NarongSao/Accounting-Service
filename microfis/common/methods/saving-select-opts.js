import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import fx from 'money';

// Collection
import {SavingProduct} from '../../imports/api/collections/saving-product.js';

export let SavingSelectOptMethods = {};

// Product
SavingSelectOptMethods.product = new ValidatedMethod({
    name: 'microfis.savingSelectOpts.product',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}},
                        {shortName: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = SavingProduct.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = `${value._id} : ${value.name} (${value.shortName})`;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});
