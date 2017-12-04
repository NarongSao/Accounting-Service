import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Purchase} from '../../common/collections/purchase';
import {Setting} from '../../../core/common/collections/setting';
import {Vendor} from '../../common/collections/vendor';
import {Client} from '../../common/collections/client';
import {Category} from '../../common/collections/category';
import {GroupCategory} from '../../common/collections/groupCategory';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing.js';


Purchase.after.insert(function (userId, doc) {
    Vendor.direct.update({_id: doc.vendorId}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});

    Category.direct.update({_id: doc.category}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});

    GroupCategory.direct.update({_id: doc.group}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});

    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {
        let vendorDoc = Vendor.findOne({_id: doc.vendorId});
        let dataForAccount = {};

        dataForAccount.journalDate = doc.purchaseDate;
        dataForAccount.branchId = doc.branchId;
        dataForAccount.voucherId = "0";
        dataForAccount.currencyId = settingDoc.baseCurrency;
        dataForAccount.memo = "Purchase From " + vendorDoc.name;
        dataForAccount.refId = doc._id;
        dataForAccount.refFrom = "Purchase";
        dataForAccount.total = doc.cost;

        let transaction = [];


        let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
        let acc_inventory= MapClosing.findOne({chartAccountCompare: "Inventory"});

        transaction.push({
            account: acc_inventory.accountDoc.code + " | " + acc_inventory.accountDoc.name,
            dr: doc.cost,
            cr: 0,
            drcr: doc.cost

        }, {
            account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
            dr: 0,
            cr: doc.cost,
            drcr: -doc.cost
        });

        dataForAccount.transaction = transaction;
        Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }

});

Purchase.after.update(function (userId, doc, fieldNames, modifier, options) {

    let purchasePrevious = this.previous;


    Vendor.direct.update({_id: purchasePrevious.vendorId}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});

    Category.direct.update({_id: purchasePrevious.category}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});

    GroupCategory.direct.update({_id: purchasePrevious.group}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});




    Vendor.direct.update({_id: modifier.$set.vendorId}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});

    Category.direct.update({_id: modifier.$set.category}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});

    GroupCategory.direct.update({_id: modifier.$set.group}, {
        $inc: {
            numberUse: 1
        }
    }, {multi: true});




    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {
        let vendorDoc = Vendor.findOne({_id: doc.vendorId});
        let dataForAccount = {};

        dataForAccount.journalDate = doc.purchaseDate;
        dataForAccount.branchId = doc.branchId;
        dataForAccount.voucherId = "0";
        dataForAccount.currencyId = settingDoc.baseCurrency;
        dataForAccount.memo = "Purchase From " + vendorDoc.name;
        dataForAccount.refId = doc._id;
        dataForAccount.refFrom = "Purchase";
        dataForAccount.total = doc.cost;

        let transaction = [];


        let acc_cash = MapClosing.findOne({chartAccountCompare: "Cash"});
        let acc_inventory= MapClosing.findOne({chartAccountCompare: "Inventory"});

        transaction.push({
            account: acc_inventory.accountDoc.code + " | " + acc_inventory.accountDoc.name,
            dr: doc.cost,
            cr: 0,
            drcr: doc.cost

        }, {
            account: acc_cash.accountDoc.code + " | " + acc_cash.accountDoc.name,
            dr: 0,
            cr: doc.cost,
            drcr: -doc.cost
        });

        dataForAccount.transaction = transaction;
        Meteor.call("api_journalUpdate", dataForAccount, function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }


})

Purchase.after.remove(function (userId, doc) {
    Vendor.direct.update({_id: doc.vendorId}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});

    Category.direct.update({_id: doc.category}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});
    GroupCategory.direct.update({_id: doc.group}, {
        $inc: {
            numberUse: -1
        }
    }, {multi: true});


    /*Integrated to Account*/
    let settingDoc = Setting.findOne();
    if (settingDoc.integrate == true) {

        Meteor.call("api_journalRemove", doc._id, "Purchase", function (err, result) {
            if (err) {
                console.log(err.message);
            }
        })
    }
})
