import {Meteor} from  'meteor/meteor';
import {check} from  'meteor/check';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Currency} from '../../../core/common/collections/currency.js';
import {LookupValue} from '../../common/collections/lookup-value.js';

export const SelectOpts = {
    dayOfWeekToEscape: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({label: '(Select One)', value: ''});
        }
        list.push({label: 'Mon', value: 1});
        list.push({label: 'Tue', value: 2});
        list.push({label: 'Wed', value: 3});
        list.push({label: 'Thu', value: 4});
        list.push({label: 'Fri', value: 5});
        list.push({label: 'Sat', value: 6});
        list.push({label: 'Sun', value: 7});

        return list;
    },
    calculateType: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'A', label: 'Amount'});
        list.push({value: 'P', label: 'Percentage'});

        return list;
    },
    accountType: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'IL', label: 'Individual Loan'});
        list.push({value: 'GL', label: 'Group Loan'});

        return list;
    },
    currency: function (selectOne = true, selector = {}) {
        let list = [];
        if (selectOne) {
            list.push({label: '(Select One)', value: ''});
        }

        Currency.find(selector)
            .forEach(function (obj) {
                list.push({label: obj._id + ' (' + obj.num + ')', value: obj._id})
            });

        return list;
    },
    paymentMethod: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'D', label: 'Daily'});
        list.push({value: 'W', label: 'Weekly'});
        // list.push({value: 'F', label: 'Two Weekly'}); // Fortnightly
        list.push({value: 'M', label: 'Monthly'});
        // list.push({value: 'Q', label: 'Quarterly'});
        // list.push({value: 'H', label: 'Half Yearly'});
        list.push({value: 'Y', label: 'Yearly'});

        return list;
    },
    interestMethod: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'Declining', label: 'Declining'});
        list.push({value: 'Flat', label: 'Flat'});

        return list;
    },
    gender: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'M', label: 'Male'});
        list.push({value: 'F', label: 'Female'});

        return list;
    },
    prefix: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'Mr', label: 'Mr'});
        list.push({value: 'Miss', label: 'Miss'});
        list.push({value: 'Ms', label: 'Ms'});
        list.push({value: 'Mrs', label: 'Mrs'});

        return list;
    },
    maritalStatus: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'S', label: 'Single'});
        list.push({value: 'M', label: 'Married'});
        list.push({value: 'D', label: 'Divorced'});
        list.push({value: 'P', label: 'Separated'});
        list.push({value: 'W', label: 'Widow/Widower'});
        list.push({value: 'U', label: 'Unknown'});

        return list;
    },
    idType: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'N', label: 'National ID'});
        list.push({value: 'F', label: 'Family Book'});
        list.push({value: 'P', label: 'Passport'});
        list.push({value: 'D', label: 'Drivers Licence'});
        list.push({value: 'G', label: 'Government Issued ID'});
        list.push({value: 'B', label: 'Birth Certificate'});
        list.push({value: 'T', label: 'Tax Number'});
        list.push({value: 'R', label: 'Resident Book'});

        return list;
    },
    relationship: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'Parent', label: 'Parent'});
        list.push({value: 'Spouse', label: 'Spouse'});

        return list;
    },
    geography: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'U', label: 'Urban'});
        list.push({value: 'S', label: 'Sub-Urban'});
        list.push({value: 'R', label: 'Rural'});

        return list;
    },
    boolean: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'Yes', label: 'Yes'});
        list.push({value: 'No', label: 'No'});

        return list;
    },
    paymentLocation: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'Office', label: 'Office'});
        list.push({value: 'Village', label: 'Village'});

        return list;
    },
    escapeDayMethod: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'NO', label: 'None'});
        list.push({value: 'GR', label: 'General'}); // Previous and Next
        list.push({value: 'AN', label: 'Always Next'}); // Always next

        return list;
    },
    history: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'N', label: 'None'});
        list.push({value: 'G', label: 'Good'});
        list.push({value: 'V', label: 'Very Good'});

        return list;
    },
    purpose: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'A', label: 'Agriculture'});
        list.push({value: 'S', label: 'Service'});
        list.push({value: 'T', label: 'Transportation'});

        return list;
    },
    purposeActivity: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({value: '', label: '(Select One)'});
        }
        list.push({value: 'N', label: 'New'});
        list.push({value: 'E', label: 'Expansion'});

        return list;
    },
};