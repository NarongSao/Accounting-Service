import './_init.js';

// Collection
import {Location} from '../../imports/api/collections/location.js';

Location.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();