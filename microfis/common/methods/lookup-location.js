import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Location} from '../../imports/api/collections/location.js';

export const lookupLocation = new ValidatedMethod({
    name: 'microfis.lookupLocation',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        locationId: {type: String}
    }).validator(),
    run({locationId}) {
        if (!this.isSimulation) {
            let data = Location.aggregate([
                {$match: {_id: locationId}},
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "parentId",
                        foreignField: "_id",
                        as: "level1"
                    }
                },
                {$unwind: {path: "$level1", preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "level1.parentId",
                        foreignField: "_id",
                        as: "level2"
                    }
                },
                {$unwind: {path: "$level2", preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "level2.parentId",
                        foreignField: "_id",
                        as: "level3"
                    }
                },
                {$unwind: {path: "$level3", preserveNullAndEmptyArrays: true}}
            ]);

            return data[0];
        }
    }
});