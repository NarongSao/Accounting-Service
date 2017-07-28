import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {MapNBCIncome} from '../../imports/api/collections/mapNBCIncome';
import {MapNBCIncomeKH} from '../../imports/api/collections/mapNBCIncomeKH';
import {MapNBCBalance} from '../../imports/api/collections/mapNBCBalance';
import {MapNBCBalanceKH} from '../../imports/api/collections/mapNBCBalanceKH';

import {ChartAccount} from '../../imports/api/collections/chartAccount';

Meteor.methods({
    getNbcNotMapping: function (isFormKhmer) {

        let obj={};
        let mapIncomeList=ChartAccount.find({accountTypeId: {$in: ['10','11','12','20','21','30']}}).map(function (obj) {
            return obj._id;
        });
        let mapBalanceList=ChartAccount.find({accountTypeId: {$in: ['40','41','50','51']}}).map(function (obj) {
            return obj._id;
        });

        if(isFormKhmer==true){
            let mapIncome = MapNBCIncomeKH.aggregate([
                {$unwind: '$transaction'},
                { $project : { data:["$transaction.accountDoc._id" ],_id: 0} },
                {$unwind: "$data"},
            ]);

            mapIncome.forEach(function (obj) {
                if(obj){
                    mapIncomeList.push(obj.data);
                }
            })


            let mapBalance= MapNBCBalanceKH.aggregate([
                {$unwind: '$transaction'},
                { $project : { data:["$transaction.accountDoc._id" ],_id: 0}},
                {$unwind: "$data"}
            ]);
            mapBalance.forEach(function (obj) {
                if(obj){
                    mapBalanceList.push(obj.data);
                }
            })

        }else {
            let mapIncome = MapNBCIncome.aggregate([
                {$unwind: '$transaction'},
                { $project : { data:["$transaction.accountDoc._id" ],_id: 0} },
                {$unwind: "$data"},
            ]);

            mapIncome.forEach(function (obj) {
                if(obj){
                    mapIncomeList.push(obj.data);
                }
            })


            let mapBalance= MapNBCBalance.aggregate([
                {$unwind: '$transaction'},
                { $project : { data:["$transaction.accountDoc._id" ],_id: 0}},
                {$unwind: "$data"}
            ]);
            mapBalance.forEach(function (obj) {
                if(obj){
                    mapBalanceList.push(obj.data);
                }
            })

        }
                obj.income=mapIncomeList;
        obj.balance=mapBalanceList;

        return obj;
    }

})



