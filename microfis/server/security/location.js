import '../configs/security.js';

// Collection
import {Location} from '../../common/collections/location.js';

Location.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();