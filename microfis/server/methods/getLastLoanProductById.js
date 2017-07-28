import {check} from 'meteor/check';
import math from 'mathjs';
import {LoanAcc} from '../../common/collections/loan-acc';


Meteor.methods({
    microfis_getLoanAccByProductId: function (loanProductId) {
        return LoanAcc.findOne({productId: loanProductId});
    }

})