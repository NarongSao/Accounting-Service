import '../configs/security.js';

// Collection
import {Penalty} from '../../common/collections/penalty.js';

Penalty.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();