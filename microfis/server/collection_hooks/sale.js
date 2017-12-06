import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Sale} from '../../common/collections/sale';
import {Purchase} from '../../common/collections/purchase';
import {Client} from '../../common/collections/client';
import {Setting} from '../../../core/common/collections/setting';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing.js';

Sale.before.insert(function (userId, doc) {
        doc.remaining=doc.price-doc.paid;
    Purchase.direct.update({_id: doc.purchaseId},{$set: {status: true,closeDate: doc.saleDate}});

});


Sale.after.insert(function (userId,doc) {
    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {
        let clientDoc = Client.findOne({_id: doc.customerId});
        let dataForAccount = {};

        dataForAccount.journalDate = doc.saleDate;
        dataForAccount.branchId = doc.branchId;
        dataForAccount.voucherId = "0";
        dataForAccount.currencyId = settingDoc.baseCurrency;
        dataForAccount.memo = "Sale To " + clientDoc.khSurname + " " +clientDoc.khGivenName;
        dataForAccount.refId = doc._id;
        dataForAccount.refFrom = "Sale";
        dataForAccount.total = doc.paid;

        let transaction = [];


        let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
        let acc_saleIncome = MapClosing.findOne({chartAccountCompare: "Sale Income"});
        let acc_inventory= MapClosing.findOne({chartAccountCompare: "Inventory"});
        let acc_cogs= MapClosing.findOne({chartAccountCompare: "COGS"});

        transaction.push({
            account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
            dr: doc.paid,
            cr: 0,
            drcr: doc.paid

        }, {
            account: acc_saleIncome.accountDoc.code + " | " + acc_saleIncome.accountDoc.name,
            dr: 0,
            cr: doc.paid,
            drcr: -doc.paid
        }, {
            account: acc_cogs.accountDoc.code + " | " + acc_cogs.accountDoc.name,
            dr: doc.price,
            cr: 0,
            drcr: doc.price

        }, {
            account: acc_inventory.accountDoc.code + " | " + acc_inventory.accountDoc.name,
            dr: 0,
            cr: doc.price,
            drcr: -doc.price
        });

        dataForAccount.transaction = transaction;
        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }
})

Sale.before.update(function (userId, doc, fieldNames, modifier, options) {
        modifier.$set.remaining=modifier.$set.price-modifier.$set.paid;

    let salePrevious = this.previous;

    Purchase.direct.update({_id: salePrevious.purchaseId},{$set: {status: false,closeDate: ""}});
        Purchase.direct.update({_id: modifier.$set.purchaseId},{$set: {status: true,closeDate: modifier.$set.saleDate}});

});

Sale.after.remove(function (userId, doc) {
    Purchase.direct.update({_id: doc.purchaseId},{$set: {status: false,closeDate: ""}});

    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {

        Meteor.call("api_journalRemove", doc._id, "Sale", function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }
})
