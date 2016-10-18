import '../configs/security.js';

// Collection
import {Holiday} from '../../common/collections/holiday.js';

Holiday.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();