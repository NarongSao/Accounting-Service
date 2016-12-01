/**
 * Created by rabbit on 11/18/16.
 */
import 'meteor/theara:collection-cache';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';


EndOfProcess.cacheTimestamp();
EndOfProcess._ensureIndex({month: 1, branchId: 1, year: 1, day: 1}, {unique: 1});