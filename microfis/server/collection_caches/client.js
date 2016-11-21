/**
 * Created by rabbit on 11/18/16.
 */
import 'meteor/theara:collection-cache';

// Collection
import {Client} from '../../common/collections/client.js';

Client.cacheTimestamp();
Client._ensureIndex({idType: 1,idNumber:1}, {unique: 1});