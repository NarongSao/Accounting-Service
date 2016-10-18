import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {Location} from '../../common/collections/location.js';

Location.before.insert(function (userId, doc) {
    // Check level
    let level = doc.level;
    let parentDoc = Location.findOne(doc.parentId);

    if (level == 1) { // Province
        doc._id = idGenerator2.gen(Location, {
            length: 2,
            selector: {level: level}
        });

    } else if (level == 2) { // District
        let prefix = doc.parentId;
        doc._id = idGenerator2.genWithPrefix(Location, {
            prefix: prefix,
            length: 2,
            selector: {level: level}
        });
        doc.parentDoc = {
            khNamePro: parentDoc.khName,
            enNamePro: parentDoc.enName
        };

    } else if (level == 3) { // Commune
        let prefix = doc.parentId;
        doc._id = idGenerator2.genWithPrefix(Location, {
            prefix: prefix,
            length: 2,
            selector: {level: level}
        });
        doc.parentDoc = {
            khNameDis: parentDoc.khName,
            enNameDis: parentDoc.enName,
            khNamePro: parentDoc.parentDoc.khNamePro,
            enNamePro: parentDoc.parentDoc.enNamePro
        };

    } else if (level == 4) { // Village
        let prefix = doc.parentId;
        doc._id = idGenerator2.genWithPrefix(Location, {
            prefix: prefix,
            length: 2,
            selector: {level: level}
        });
        doc.parentDoc = {
            khNameCom: parentDoc.khName,
            enNameCom: parentDoc.enName,
            khNameDis: parentDoc.parentDoc.khNameDis,
            enNameDis: parentDoc.parentDoc.enNameDis,
            khNamePro: parentDoc.parentDoc.khNamePro,
            enNamePro: parentDoc.parentDoc.enNamePro
        };
    }
});
