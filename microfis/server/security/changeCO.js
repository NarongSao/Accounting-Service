import '../configs/security.js';

// Collection
import {ChangeCO} from '../../common/collections/changeCO';

ChangeCO.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();