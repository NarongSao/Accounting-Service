import {check} from 'meteor/check';
import math from 'mathjs';
import {Group} from '../../../microfis/common/collections/group';


Meteor.methods({
    microfis_getGroupById: function (groupId) {
        return Group.findOne({
            _id: groupId,
        });
    }
})