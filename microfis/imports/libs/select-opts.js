import {Meteor} from  'meteor/meteor';
import {check} from  'meteor/check';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Currency} from '../../../core/common/collections/currency.js';
import {Setting} from '../../../core/common/collections/setting.js';
import {Exchange} from '../../../core/common/collections/exchange.js';
import {Branch} from '../../../core/common/collections/branch.js';
import {CreditOfficer} from '../../../microfis/common/collections/credit-officer.js';
import {Product} from '../../../microfis/common/collections/product.js';
import {Location} from '../../../microfis/common/collections/location.js';
import {Fund} from '../../../microfis/common/collections/fund.js';
import {ProductStatus} from '../../../microfis/common/collections/productStatus.js';
import {Client} from '../../../microfis/common/collections/client';
import {Fee} from '../../../microfis/common/collections/fee';

import {ExchangeNBC} from '../../../acc/imports/api/collections/exchangeNBC';
import {LookupValue} from '../../common/collections/lookup-value.js';
import {SavingAcc} from '../../common/collections/saving-acc.js';

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
        list.push({value: 'EL', label: 'Enterprise Loan'});
        list.push({value: 'OL', label: 'Other Loan'});
        list.push({value: 'RPSL', label: 'Related Party Shareholders Loan'});
        list.push({value: 'RPML', label: 'Related Party Manager Loan'});
        list.push({value: 'RPEL', label: 'Related Party Employees Loan'});
        list.push({value: 'RPAL', label: 'Related Party External Auditors Loan'});

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
        list.push({value: 'Annuity', label: 'Annuity'});
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
    savingAcc: function (clientId) {
        let list = [];
        list.push({value: '', label: '(Select One)'});

        if (Meteor.isClient) {
            let savingList = Session.get("savingList");
            if (savingList.length > 0) {
                savingList.forEach(function (obj) {
                    list.push({
                        value: obj._id,
                        label: obj._id + " : " + moment(obj.accDate).format("DD/MM/YYYY") + " : " + obj.currencyId
                    });
                });
            }
        }

        return list;
    },
    feeOpt: function () {
        let list = [];
        if (Meteor.isClient) {
            Meteor.subscribe('microfis.fee');
            Fee.find().forEach(function (obj) {
                list.push({label: obj.name, value: obj._id});
            });

            return list;
        }
    }
};


export const SelectOptsReport = {
    branch: function () {
        var list = [];
        list.push({label: "(Select All)", value: "All"});
        Branch.find()
            .forEach(function (obj) {
                list.push({label: obj.enName, value: obj._id});
            });

        return list;
    },
    creditOfficer: function () {
        Meteor.subscribe('microfis.creditOfficer');

        var list = [];
        list.push({label: "(Select All)", value: "All"});
        CreditOfficer.find()
            .forEach(function (obj) {
                list.push({label: obj.khName, value: obj._id});
            });

        return list;
    },
    client: function () {
        Meteor.subscribe('microfis.client');

        var list = [];
        list.push({label: "(Select One)", value: ""});
        Client.find()
            .forEach(function (obj) {
                list.push({label: obj.khSurname + " " + obj.khGivenName, value: obj._id});
            });

        return list;
    },
    paymentMethod: function () {
        var list = [];
        list.push(
            {label: "(Select All)", value: "All"},
            {label: "Daily", value: "D"},
            {label: "Month", value: "M"},
            {label: "Week", value: "W"},
            {label: "Yearly", value: "Y"}
        );
        return list;
    },
    exchange: function () {
        Meteor.subscribe('core.exchange');
        Meteor.subscribe('core.setting');


        var list = [];
        var setting = Setting.findOne();
        if (setting) {
            let baseCurrency = setting.baseCurrency;
            list.push({label: "(Select One)", value: ""});
            Exchange.find({base: baseCurrency}, {sort: {exDate: -1}})
                .forEach(function (obj) {
                    list.push({
                        label: moment(obj.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(obj.rates),
                        value: obj._id
                    });
                });
        }


        return list;
    },

    exchangeNBC: function () {
        Meteor.subscribe('acc.exchangeNBC');

        var list = [];
        list.push({label: "(Select One)", value: ""});
        ExchangeNBC.find({base: 'KHR'}, {sort: {dateTime: -1}})
            .forEach(function (obj) {
                list.push({
                    label: moment(obj.dateTime).format("DD/MM/YYYY") + ' | ' + JSON.stringify(obj.rates),
                    value: obj._id
                });
            });

        return list;
    },
    currency: function () {
        Meteor.subscribe('core.currency');

        var list = [];
        list.push({label: "(Select All)", value: "All"});
        Currency.find()
            .forEach(function (obj) {
                list.push({label: obj._id, value: obj._id});
            });

        return list;
    },
    product: function () {
        Meteor.subscribe('microfis.product');

        var list = [];
        list.push({label: "(Select All)", value: "All"});
        Product.find()
            .forEach(function (obj) {
                list.push({label: obj.name, value: obj._id});
            });

        return list;
    },
    location: function () {

        Meteor.subscribe('microfis.location');

    },
    fund: function () {
        Meteor.subscribe('microfis.fund');
        var list = [];
        list.push({label: "(Select All)", value: "All"});
        Fund.find()
            .forEach(function (obj) {
                list.push({label: obj.name, value: obj._id});
            });

        return list;
    },
    classify: function () {
        Meteor.subscribe('microfis.productStatus');
        var list = [];
        list.push({label: "(Select All)", value: "All"});
        ProductStatus.find()
            .forEach(function (obj) {
                list.push({label: obj.name, value: obj._id});
            });

        return list;
    },
    repaidFrequency(){
        let i = 1;
        let list = [{
            label: "(Select All)",
            value: "All"
        }]
        for (i; i < 15; i++) {
            list.push({label: i + "", value: i});
        }
        return list;
    }

};
