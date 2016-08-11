import './_init.js';

// Collection
import {Fee} from '../../imports/api/collections/fee.js';

Fee.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();