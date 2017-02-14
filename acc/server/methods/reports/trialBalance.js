import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/common/collections/company.js';
import {Setting} from '../../../../core/common/collections/setting';
import {Exchange} from '../../../../core/common/collections/exchange';

import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';

Meteor.methods({
    acc_trialBalanceReport: function (params) {
        if (!this.isSimulation) {
            var data = {
                title: {},
                header: {},
                content: [{
                    index: 'No Result'
                }],
                footer: {}
            };


            /****** Title *****/
            data.title = Company.findOne();

            /****** Header *****/

            let exchangeData = Exchange.findOne({_id: params.exchangeDate});
            params.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates)


            data.header = params;
            /****** Content *****/
            var self = params;

            var selector = {};
            var exchangeDate = self.exchangeDate;

            var selectorGetLastBalance = {};
            var selectorGetLastDate = {};
            //Get Last Date Closing
            if (self.date != null) {
                selectorGetLastDate.closeDate = {
                    $lt: moment(self.date, "DD/MM/YYYY").toDate()
                };
            }
            if (self.currencyId != "All") {
                selectorGetLastDate.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selectorGetLastDate.branchId = self.branchId;
            }
            var lastDate = CloseChartAccount.findOne(
                selectorGetLastDate, {
                    sort: {
                        closeDate: -1
                    }
                });

            //Parameter for Balance Last End Of Process
            if (lastDate != null) {
                selectorGetLastBalance.closeDate = lastDate.closeDate;
            }
            if (self.currencyId != "All") {
                selectorGetLastBalance.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selectorGetLastBalance.branchId = self.branchId;
            }
            //Parameter for Trial Balance
            if (lastDate != null) {
                selector.journalDate = {
                    $gte: moment(moment(lastDate.closeDate).format("DD/MM/YYYY"), "DD/MM/YYYY").add(1, 'days').toDate(),
                    $lt: moment(self.date, "DD/MM/YYYY").add(1, 'days').toDate()
                };

            } else {
                selector.journalDate = {
                    $lt: moment(self.date, "DD/MM/YYYY").add(1, 'days').toDate()
                };
            }
            if (self.currencyId != "All") {
                selector.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selector.branchId = self.branchId;
            }

            if (self.currencyId != "All") {
                var baseCurrency = self.currencyId;
            } else {
                baseCurrency = Setting.findOne().baseCurrency;
            }

            var result = [];
            var grandTotalDr = 0;
            var grandTotalCr = 0;
            var i = 1;

            var content = Meteor.call("getTrialBalance", selector, baseCurrency,
                exchangeDate, selectorGetLastBalance, lastDate, self.showNonActive);
            content.reduce(function (key, val) {
                if (!key[val.account]) {
                    key[val.account] = {
                        result: val.result,
                        name: val.name,
                        account: val.account,
                        currency: baseCurrency,
                        code: val.code,
                        order: i
                    };
                    i++;
                    result.push(key[val.account]);
                } else {
                    key[val.account].result += math.round(val.result, 2);
                }
                return key;
            }, {});


            result.map(function (o) {
                if (o.result > 0) {
                    grandTotalDr += math.round(o.result, 2);
                } else {
                    grandTotalCr += math.round(o.result, 2);
                }
            });
            data.grandTotalDr = grandTotalDr;
            data.grandTotalCr = -1 * grandTotalCr;

            if (math.abs(data.grandTotalDr - data.grandTotalCr) < 0.05 &&
                baseCurrency == "USD") {
                data.grandTotalDr = data.grandTotalCr;
            } else if (math.abs(data.grandTotalDr - data.grandTotalCr) < 500 &&
                baseCurrency == "KHR") {
                data.grandTotalDr = data.grandTotalCr;
            }
            data.currencySelect = baseCurrency;

            if (result.length > 0) {
                data.result = result;
            }
            return data;
        }
    },
    acc_trialBalanceReportAllCurrency: function (params) {
        if (!this.isSimulation) {
            var data = {
                title: {},
                header: {},
                content: [{
                    index: 'No Result'
                }],
                footer: {}
            };


            /****** Title *****/
            data.title = Company.findOne();

            /****** Header *****/

            let exchangeData = Exchange.findOne({_id: params.exchangeDate});
            params.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates)


            data.header = params;
            /****** Content *****/
            var self = params;

            var selector = {};
            var exchangeDate = self.exchangeDate;

            var selectorGetLastBalance = {};
            var selectorGetLastDate = {};
            //Get Last Date Closing
            if (self.date != null) {
                selectorGetLastDate.closeDate = {
                    $lt: moment(self.date, "DD/MM/YYYY").toDate()
                };
            }
            if (self.currencyId != "All") {
                selectorGetLastDate.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selectorGetLastDate.branchId = self.branchId;
            }
            var lastDate = CloseChartAccount.findOne(
                selectorGetLastDate, {
                    sort: {
                        closeDate: -1
                    }
                });

            //Parameter for Balance Last End Of Process
            if (lastDate != null) {
                selectorGetLastBalance.closeDate = lastDate.closeDate;
            }
            if (self.currencyId != "All") {
                selectorGetLastBalance.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selectorGetLastBalance.branchId = self.branchId;
            }
            //Parameter for Trial Balance
            if (lastDate != null) {
                selector.journalDate = {
                    $gte: moment(moment(lastDate.closeDate).format("DD/MM/YYYY"), "DD/MM/YYYY").add(1, 'days').toDate(),
                    $lt: moment(self.date, "DD/MM/YYYY").add(1, 'days').toDate()
                };

            } else {
                selector.journalDate = {
                    $lt: moment(self.date, "DD/MM/YYYY").add(1, 'days').toDate()
                };
            }
            if (self.currencyId != "All") {
                selector.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selector.branchId = self.branchId;
            }

            if (self.currencyId != "All") {
                var baseCurrency = self.currencyId;
            } else {
                baseCurrency = Setting.findOne().baseCurrency;
            }

            var result = [];
            var grandTotalDr = 0;
            var grandTotalDrUSD = 0;
            var grandTotalDrKHR = 0;
            var grandTotalDrTHB = 0;

            var grandTotalCr = 0;
            var grandTotalCrUSD = 0;
            var grandTotalCrKHR = 0;
            var grandTotalCrTHB = 0;
            var i = 1;

            var content = Meteor.call("getTrialBalance", selector, baseCurrency,
                exchangeDate, selectorGetLastBalance, lastDate, self.showNonActive);

            content.reduce(function (key, val) {
                if (!key[val.account]) {
                    key[val.account] = {
                        result: val.result,
                        valRiel: val.valRiel,
                        valDollar: val.valDollar,
                        valBaht: val.valBaht,

                        name: val.name,
                        account: val.account,
                        currency: baseCurrency,
                        code: val.code,
                        order: i
                    };
                    i++;
                    result.push(key[val.account]);
                } else {
                    key[val.account].result += math.round(val.result, 2);
                    key[val.account].valRiel += math.round(val.valRiel, 2);
                    key[val.account].valDollar += math.round(val.valDollar, 2);
                    key[val.account].valBaht += math.round(val.valBaht, 2);
                }
                return key;
            }, {});


            result.map(function (o) {
                if (o.result > 0) {
                    grandTotalDr += math.round(o.result, 2);
                } else {
                    grandTotalCr += math.round(o.result, 2);
                }

                if (o.valRiel > 0) {
                    grandTotalDrKHR += math.round(o.valRiel, 2);
                } else {
                    grandTotalCrKHR += math.round(o.valRiel, 2);
                }

                if (o.valDollar > 0) {
                    grandTotalDrUSD += math.round(o.valDollar, 2);
                } else {
                    grandTotalCrUSD += math.round(o.valDollar, 2);
                }

                if (o.valBaht > 0) {
                    grandTotalDrTHB += math.round(o.valBaht, 2);
                } else {
                    grandTotalCrTHB += math.round(o.valBaht, 2);
                }
            });
            data.grandTotalDr = grandTotalDr;
            data.grandTotalCr = -1 * grandTotalCr;

            data.grandTotalDrKHR = grandTotalDrKHR;
            data.grandTotalCrKHR = -1 * grandTotalCrKHR;

            data.grandTotalDrUSD = grandTotalDrUSD;
            data.grandTotalCrUSD = -1 * grandTotalCrUSD;

            data.grandTotalDrTHB = grandTotalDrTHB;
            data.grandTotalCrTHB = -1 * grandTotalCrTHB;

            if (math.abs(data.grandTotalDr - data.grandTotalCr) < 0.05 &&
                baseCurrency == "USD") {
                data.grandTotalDr = data.grandTotalCr;
            } else if (math.abs(data.grandTotalDr - data.grandTotalCr) < 500 &&
                baseCurrency == "KHR") {
                data.grandTotalDr = data.grandTotalCr;
            }

            if (math.abs(data.grandTotalDrUSD - data.grandTotalCrUSD) < 0.05) {
                data.grandTotalDrUSD = data.grandTotalCrUSD;
            }

            if (math.abs(data.grandTotalDrKHR - data.grandTotalCrKHR) <500) {
                data.grandTotalDrKHR = data.grandTotalCrKHR;
            }

            if (math.abs(data.grandTotalDrTHB - data.grandTotalCrTHB) < 5) {
                data.grandTotalDrTHB = data.grandTotalCrTHB;
            }


            data.currencySelect = baseCurrency;

            if (result.length > 0) {
                data.result = result;
            }
            return data;
        }
    }
});
