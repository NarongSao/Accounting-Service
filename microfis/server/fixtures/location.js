import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {Location} from '../../common/collections/location.js';

Meteor.startup(function () {
    if (Location.find().count() == 0) {
        1
        let data = JSON.parse(Assets.getText('location.json')).ProvincialList;
        _.forEach(data, (value) => {
            value.Code = "0" + value.Code;
            value.Parent = "0" + value.Parent;
            // Find parent id
            let parentId;
            if (value.Type != 'P') {
                let parentDoc = Location.findOne({code: value.Parent});
                parentId = parentDoc ? parentDoc._id : undefined;
            }
            Location.insert({
                type: value.Type,
                code: value.Code,
                name: value.EnName,
                khName: value.KhName,
                parent: parentId,
            });

            // {"type" : "D", "parent" : "00000001", "code" : "0101", "name" : "Sangke"}
        });

        /*let data2 = JSON.parse(Assets.getText('BMC.json')).ProvincialList;
        _.forEach(data2, (value) => {
            value.Code = "0" + value.Code;
            value.Parent = "0" + value.Parent;
            // Find parent id
            let parentId;
            if (value.Type != 'P') {
                let parentDoc = Location.findOne({code: value.Parent});
                parentId = parentDoc ? parentDoc._id : undefined;
            }
            Location.insert({
                type: value.Type,
                code: value.Code,
                name: value.EnName,
                khName: value.KhName,
                parent: parentId,
            });

            // {"type" : "D", "parent" : "00000001", "code" : "0101", "name" : "Sangke"}
        });

        let pln = JSON.parse(Assets.getText('PLN.json')).ProvincialList;
        _.forEach(pln, (value) => {

            value.Code = value.Code;
            value.Parent = value.Parent;
            // Find parent id
            let parentId;
            if (value.Type != 'P') {
                let parentDoc = Location.findOne({code: value.Parent});
                parentId = parentDoc ? parentDoc._id : undefined;
            }
            Location.insert({
                type: value.Type,
                code: value.Code,
                name: value.EnName,
                khName: value.KhName,
                parent: parentId,
            });

            // {"type" : "D", "parent" : "00000001", "code" : "0101", "name" : "Sangke"}
        });*/

        let sr = JSON.parse(Assets.getText('SR.json')).ProvincialList;
        _.forEach(sr, (value) => {

            value.Code = value.Code;
            value.Parent = value.Parent;
            // Find parent id
            let parentId;
            if (value.Type != 'P') {
                let parentDoc = Location.findOne({code: value.Parent});
                parentId = parentDoc ? parentDoc._id : undefined;
            }
            Location.insert({
                type: value.Type,
                code: value.Code,
                name: value.EnName,
                khName: value.KhName,
                parent: parentId,
            });

            // {"type" : "D", "parent" : "00000001", "code" : "0101", "name" : "Sangke"}
        });
    }
});