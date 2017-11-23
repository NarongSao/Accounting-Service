import '../configs/security.js';

// Collection
import {Purchase} from '../../common/collections/purchase';

Purchase.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();