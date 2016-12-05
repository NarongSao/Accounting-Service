/**
 * Created by rabbit on 11/18/16.
 */
import 'meteor/theara:collection-cache';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

Repayment.cacheTimestamp();
Repayment._ensureIndex({voucherId: 1, currencyId: 1}, {unique: 1});