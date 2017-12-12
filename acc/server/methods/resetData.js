import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Journal} from '../../imports/api/collections/journal';
import {ExchangeNBC} from '../../imports/api/collections/exchangeNBC';
import {NetInCome} from '../../imports/api/collections/netIncome';
import {ChartAccount} from '../../imports/api/collections/chartAccount';
import {CloseChartAccount} from '../../imports/api/collections/closeChartAccount';
import {Closing} from '../../imports/api/collections/closing';
import {CloseChartAccountPerMonth} from '../../imports/api/collections/closeChartAccountPerMonth';
import {DateEndOfProcess} from '../../imports/api/collections/dateEndOfProcess';
import {DepExpList} from '../../imports/api/collections/depExpList';
import {FixAssetDep} from '../../imports/api/collections/fixAssetDep';
import {FixAssetExpense} from '../../imports/api/collections/fixAssetExpense';
import {MapFixAsset} from '../../imports/api/collections/mapFixAsset';
import {PaymentReceiveMethod} from '../../imports/api/collections/paymentReceiveMethod';

Meteor.methods({
    resetDataAcc: function (selector) {
        Journal.remove({})
        ExchangeNBC.remove({})
        NetInCome.remove({})
        ChartAccount.remove({})
        CloseChartAccount.remove({})
        Closing.remove({})
        CloseChartAccountPerMonth.remove({})
        DateEndOfProcess.remove({})
        DepExpList.remove({})
        FixAssetDep.remove({})
        FixAssetExpense.remove({})
        MapFixAsset.remove({})
        PaymentReceiveMethod.remove({})
    }
});