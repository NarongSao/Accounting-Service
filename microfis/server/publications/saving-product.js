import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {SavingProduct} from '../../common/collections/saving-product';

Meteor.publish('microfis.savingProductById', function microfisSavingProductById(productId) {
    this.unblock();
    Meteor._sleepForMs(100);

    new SimpleSchema({
        productId: {type: String}
    }).validate({productId});

    if (!this.userId) {
        return this.ready();
    }

    return SavingProduct.find({_id: productId});
});
