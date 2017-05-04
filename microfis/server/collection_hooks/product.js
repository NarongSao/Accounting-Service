import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Product} from '../../common/collections/product.js';
import {Fee} from '../../common/collections/fee';
import {PenaltyClosing} from '../../common/collections/penalty-closing';
import {Penalty} from '../../common/collections/penalty';
import {Fund} from '../../common/collections/fund';

Product.before.insert(function (userId, doc) {
    doc._id = idGenerator2.gen(Product, {length: 3});
});

Product.after.insert(function (userId, doc) {


    Fee.direct.update({_id: {$in: _.isArray(doc.feeId) ? doc.feeId : [doc.feeId]}}, {$inc: {numberOfProduct: 1}}, {multi: true});
    PenaltyClosing.direct.update({_id: doc.penaltyClosingId}, {$inc: {numberOfProduct: 1}}, {multi: true});
    Penalty.direct.update({_id: doc.penaltyId}, {$inc: {numberOfProduct: 1}}, {multi: true});
})

Product.after.remove(function (userId, doc) {
    Fee.direct.update({_id: {$in: _.isArray(doc.feeId) ? doc.feeId : [doc.feeId]}}, {$inc: {numberOfProduct: -1}}, {multi: true});
    PenaltyClosing.direct.update({_id: doc.penaltyClosingId}, {$inc: {numberOfProduct: -1}}, {multi: true});
    Penalty.direct.update({_id: doc.penaltyId}, {$inc: {numberOfProduct: -1}}, {multi: true});
})


Product.after.update(function (userId, doc) {

    let oldData = this.previous;


    Fee.direct.update({_id: {$in: _.isArray(oldData.feeId) ? oldData.feeId : [oldData.feeId]}}, {$inc: {numberOfProduct: -1}}, {multi: true});
    PenaltyClosing.direct.update({_id: oldData.penaltyClosingId}, {$inc: {numberOfProduct: -1}}, {multi: true});
    Penalty.direct.update({_id: oldData.penaltyId}, {$inc: {numberOfProduct: -1}}, {multi: true});

    console.log(doc);
    Fee.direct.update({_id: {$in: _.isArray(doc.feeId) ? doc.feeId : [doc.feeId]}}, {$inc: {numberOfProduct: 1}}, {multi: true});
    PenaltyClosing.direct.update({_id: doc.penaltyClosingId}, {$inc: {numberOfProduct: 1}}, {multi: true});
    Penalty.direct.update({_id: doc.penaltyId}, {$inc: {numberOfProduct: 1}}, {multi: true});
})
