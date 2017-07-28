import {check} from 'meteor/check';
import math from 'mathjs';
import {SavingAcc} from '../../common/collections/saving-acc';


Meteor.methods({
    microfis_getSavingAccByProductId: function (savingProductId) {
        return SavingAcc.findOne({productId: savingProductId});
    }

})