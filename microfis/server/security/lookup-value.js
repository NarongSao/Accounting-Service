import './_init.js';

// Collection
import {LookupValue} from '../../imports/api/collections/lookup-value.js';

LookupValue.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();