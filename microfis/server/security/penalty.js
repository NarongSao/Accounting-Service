import './_init.js';

// Collection
import {Penalty} from '../../imports/api/collections/penalty.js';

Penalty.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();