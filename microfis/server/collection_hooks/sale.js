import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Sale} from '../../common/collections/sale';
import {Purchase} from '../../common/collections/purchase';

Sale.before.insert(function (userId, doc) {
        doc.remaining=doc.price-doc.paid;
    Purchase.direct.update({_id: doc.purchaseId},{$set: {status: true,closeDate: doc.saleDate}});

});

Sale.before.update(function (userId, doc, fieldNames, modifier, options) {
        modifier.$set.remaining=modifier.$set.price-modifier.$set.paid;

    let salePrevious = this.previous;

    Purchase.direct.update({_id: salePrevious.purchaseId},{$set: {status: false,closeDate: ""}});
        Purchase.direct.update({_id: modifier.$set.purchaseId},{$set: {status: true,closeDate: modifier.$set.saleDate}});

});

Sale.after.remove(function (userId, doc) {
    Purchase.direct.update({_id: doc.purchaseId},{$set: {status: false,closeDate: ""}});
})
