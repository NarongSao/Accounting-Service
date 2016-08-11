import './_init.js';

// Collection
import {Holiday} from '../../imports/api/collections/holiday.js';

Holiday.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();