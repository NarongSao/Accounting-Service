import '../configs/security.js';

// Collection
import {Setting} from '../../common/collections/setting.js';

Setting.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();