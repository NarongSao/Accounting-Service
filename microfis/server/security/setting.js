import './_init.js';

// Collection
import {Setting} from '../../imports/api/collections/setting.js';

Setting.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();