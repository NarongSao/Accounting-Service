import './_init.js';

// Collection
import {PenaltyClosing} from '../../imports/api/collections/penalty-closing.js';

PenaltyClosing.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();