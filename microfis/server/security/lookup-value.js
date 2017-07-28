import '../configs/security.js';

// Collection
import {LookupValue} from '../../common/collections/lookup-value.js';

LookupValue.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();