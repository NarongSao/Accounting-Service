import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Setting} from '../../common/collections/setting.js';

Meteor.publish('microfis.setting', function microfisSetting() {
    this.unblock();

    if (this.userId) {
        let data = Setting.find();
        return data;
    }

    this.ready();
});
