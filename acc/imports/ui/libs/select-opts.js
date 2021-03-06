import {Meteor} from  'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Branch} from '../../../../core/common/collections/branch.js';
import {UserSchema} from '../../../../core/common/collections/user-schema';
import {Setting} from '../../../../core/common/collections/setting';
import {ChartAccount} from '../../api/collections/chartAccount.js';
import {AccountType} from '../../api/collections/accountType';
import {ChartAccountNBC} from '../../api/collections/chartAccountNBC.js';
import {ChartAccountNBCKH} from '../../api/collections/chartAccountNBCKH.js';
import {Currency} from '../../api/collections/currency.js';
import {ExchangeNBC} from '../../api/collections/exchangeNBC';
import {PaymentReceiveMethod} from '../../api/collections/paymentReceiveMethod';
import {MapUserAndAccount} from '../../api/collections/mapUserAndAccount';

import {Exchange} from '../../../../core/common/collections/exchange.js';


import {SpaceChar} from '../../../common/configs/space';

// Collection Core


export const SelectOpts = {
    branch: function (selectOne = true) {
        let list = [];
        if (selectOne) {
            list.push({label: "(Select One)", value: ""});
        }

        Branch.find()
            .forEach(function (obj) {
                list.push({label: obj.enName, value: obj._id});
            });

        return list;
    },
    gender: function () {
        let list = [
            {label: "(Select One)", value: ""},
            {label: "Male", value: "M"},
            {label: "Female", value: "F"}
        ];

        return list;
    },
    gender: function (selectOne) {
        var list = [];
        if (!_.isEqual(selectOne, false)) {
            list.push({label: "(Select One)", value: ""});
        }
        list.push({label: 'Male', value: 'M'});
        list.push({label: 'Female', value: 'F'});

        return list;
    },

    depType: function () {
        var typeArr = [];
        typeArr.push({
            value: '',
            label: "(Select One)"
        }, {
            value: '01: Straight Line',
            label: "01: Straight Line"
        }, {
            value: '02: Sum Of Year Digits',
            label: "02: Sum Of Year Digits"
        }, {
            value: '03: Declining Balance',
            label: "03: Declining Balance"
        })
        return typeArr;
    }, fixAssetChatAccount: function () {
        var listChartAccount = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: '11'}, {sort: {code: 1}})
            .forEach(function (obj) {
                listChartAccount.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name),
                    value: obj.code + " | " + obj.name
                })
            });
        return listChartAccount;
    }, fixAssetList: function () {
        var listChartAccount = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: '11'}, {sort: {code: 1}})
            .forEach(function (obj) {
                listChartAccount.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name),
                    value: obj._id
                })
            });
        return listChartAccount;
    }, fixAssetExpenseList: function () {
        var listChartAccount = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: '50'}, {sort: {code: 1}})
            .forEach(function (obj) {
                listChartAccount.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name),
                    value: obj._id
                })
            });
        return listChartAccount;
    },
    cashFlowCategory: function () {
        var list = [{label: "(Select One)", value: ""}];
        list.push({
            label: "Operating Activities", value: "Operating Activities"
        }, {
            label: "Investing Activities", value: "Investing Activities"
        }, {
            label: "Financing Activities", value: "Financing Activities"
        })

        return list;
    },
    parent: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find(selector, {sort: {code: 1}})
            .forEach(function (obj) {
                var accountType = AccountType.findOne(obj.accountTypeId).name;
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name + "--" + accountType),
                    value: obj._id
                })
            });
        return list;
    },
    accountType: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select One)", value: ""}];
        AccountType.find(selector)
            .forEach(function (obj) {
                list.push({label: obj._id + " | " + obj.name, value: obj._id})
            });
        return list;
        //}
    },
    chartAccountId: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find(selector, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name),
                    value: obj._id
                })
            });
        return list;
    },
    chartAccountNBC: function (selector) {
        Meteor.subscribe('acc.chartAccountNBC');
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select One)", value: ""}];
        ChartAccountNBC.find(selector, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: obj.code + " | " + obj.name,
                    value: obj._id
                })
            });
        return list;
    }, chartAccountNBCKH: function (selector) {
        Meteor.subscribe('acc.chartAccountNBCKH');

        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select One)", value: ""}];
        ChartAccountNBCKH.find(selector, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: obj.code + " | " + obj.name,
                    value: obj._id
                })
            });
        return list;
    },
    chartAccount: function () {
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find({}, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name,
                    value: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name
            })
            });
        return list;
    }, chartAccountAsset: function () {
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: {$in: ['10', '11', '12']}}, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name,
                    value: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name
                })
            });
        return list;
    }, chartAccountIncome: function () {
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: {$in: ['40', '41']}}, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name,
                    value: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name
                })
            });
        return list;
    }, chartAccountExpense: function () {
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: {$in: ['50', '51']}}, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name,
                    value: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name
                })
            });
        return list;
    }, chartAccountLiability: function () {
        var list = [{label: "(Select One)", value: ""}];
        ChartAccount.find({accountTypeId: {$in: ['20', '21']}}, {sort: {code: 1}})
            .forEach(function (obj) {
                list.push({
                    label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name,
                    value: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code).string + " | " + obj.name
                })
            });
        return list;
    },
    currency: function (selectAll) {
        var list = [];
        if (!_.isEqual(selectAll, false)) {
            list.push({label: "(Select All)", value: "All"});
        }
        if (_.isEqual(selectAll, false)) {
            list.push({label: "(Select One)", value: ""});
        }
        Currency.find()
            .forEach(function (obj) {
                list.push({label: obj._id, value: obj._id});
            });
        return list;
    }
    ,
    currencyClosing: function () {
        Meteor.subscribe('core.setting');

        var list = [];
        list.push({label: "(Select One)", value: ""});
        var currencyBase = Setting.findOne().baseCurrency;
        Currency.find({_id: {$not: currencyBase}})
            .forEach(function (obj) {
                list.push({label: obj._id, value: obj._id});
            });
        return list;
    },
    paymentReceiveMethod: function () {
        let list = [];
        // list.push({label: "(Select One)", value: ""});
        PaymentReceiveMethod.find().forEach(function (obj) {
            list.push({
                label: obj.chartAccountCompare,
                value: Spacebars.SafeString(SpaceChar.space(obj.accountDoc.level * 6) + obj.accountDoc.code).string + " | " + obj.accountDoc.name
            })
        });

        return list;
    }
    , branchForUser: function (selectOne, userId) {
        Meteor.subscribe('core.branch');

        var list = [];
        if (!_.isEqual(selectOne, false)) {
            list.push({label: "All", value: ""});
        }
        var userId = _.isUndefined(userId) ? Meteor.userId() : userId;
        Meteor.users.findOne(userId).rolesBranch
            .forEach(function (branch) {
                var label = Branch.findOne(branch).enName;
                list.push({label: label, value: branch});
            });
        return list;
    },
    backupAndRestoreTypes: function () {
        return [
            {value: '', label: 'Select One'},
            {value: 'Setting', label: 'Setting'},
            {value: 'Default', label: 'Default'},
            {value: 'Setting,Default', label: 'Setting And Default'}
        ];
    },
    getUserList(){

        Meteor.subscribe(
            'core.user'
        );
        let data = Meteor.users.find();
        let list = [{label: "(Select One)", value: ""}];

        data.forEach(function (obj) {
            list.push({label: obj.username, value: obj._id});
        });
        return list;

    }
};


export const SelectOptsReport = {
    branchByClosing: function () {
        var list = [];
        list.push({label: "(Select One)", value: ""});
        Branch.find()
            .forEach(function (obj) {
                list.push({label: obj.enName, value: obj._id});
            });

        return list;
    }, branch: function () {
        var list = [];
        list.push({label: "(Select All)", value: "All"});
        Branch.find()
            .forEach(function (obj) {
                list.push({label: obj.enName, value: obj._id});
            });

        return list;
    },
    accountType: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        /* var list = [{label: "(Select All)", value: "All"}];*/
        var list = [];
        AccountType.find(selector)
            .forEach(function (obj) {
                list.push({label: obj._id + " | " + obj.name, value: obj._id})
            });
        return list;
        //}
    },
    exchange: function () {
        Meteor.subscribe('core.setting');
        var list = [];
        var baseCurrency = Setting.findOne().baseCurrency;
        list.push({label: "(Select One)", value: ""});
        Exchange.find({base: baseCurrency}, {sort: {exDate: -1}})
            .forEach(function (obj) {
                list.push({
                    label: moment(obj.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(obj.rates),
                    value: obj._id
                });
            });

        return list;
    }, exchangeNBC: function () {
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
    chartAccountId: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [{label: "(Select All)", value: "All"}];
        var accountType = Session.get('accountTypeIdSession');
        if (accountType != null) {
            selector.accountTypeId = {$in: accountType};

            ChartAccount.find(selector, {sort: {code: 1}})
                .forEach(function (obj) {
                    var accountType = AccountType.findOne(obj.accountTypeId).name;
                    list.push({
                        label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name + " | " + accountType),
                        value: obj._id
                    })
                });

        }
        return list;
    },

    chartAccountFilter: function (selector) {
        var selector = _.isUndefined(selector) ? {} : selector;
        var list = [];
        var accountType = Session.get('accountTypeIdSession');
        if (accountType != null) {
            selector.accountTypeId = {$in: accountType};

            let result = MapUserAndAccount.findOne({userId: Meteor.user()._id});

            if (result != null) {
                let accountIdList = [];
                result.transaction.forEach(function (obj) {
                    accountIdList.push(obj.accountDoc._id);
                })

                selector._id = {$in: accountIdList};
            } else {
                list.push({label: "(Select All)", value: "All"});
            }

            ChartAccount.find(selector, {sort: {code: 1}})
                .forEach(function (obj) {
                    var accountType = AccountType.findOne(obj.accountTypeId).name;
                    list.push({
                        label: Spacebars.SafeString(SpaceChar.space(obj.level * 6) + obj.code + " | " + obj.name + " | " + accountType),
                        value: obj._id
                    })
                });

        }
        return list;
    }
};


