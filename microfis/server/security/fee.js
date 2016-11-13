import '../configs/security.js';

// Collection
import {Fee} from '../../common/collections/fee.js';

Fee.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();