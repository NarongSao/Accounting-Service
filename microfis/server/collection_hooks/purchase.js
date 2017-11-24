import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Purchase} from '../../common/collections/purchase';
import {Vendor} from '../../common/collections/vendor';
import {Category} from '../../common/collections/category';
import {GroupCategory} from '../../common/collections/groupCategory';

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
})
