import '../configs/security.js';

// Collection
import {Vendor} from '../../common/collections/vendor';

Vendor.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();