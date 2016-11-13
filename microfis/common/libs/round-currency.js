import {check} from 'meteor/check';
import math from 'mathjs';

export const roundCurrency = function (amount, currencyId) {
    check(amount, Number);
    check(currencyId, String);

    // Check currency
    if (currencyId == 'KHR') {
        amount = roundKhr(amount);
    } else if (currencyId == 'USD') {
        amount = math.round(amount, 2);
    } else if (currencyId == 'THB') {
        amount = math.round(amount);
    }

    return amount;
};