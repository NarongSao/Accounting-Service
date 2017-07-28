import '../configs/security.js';

// Collection
import {PenaltyClosing} from '../../common/collections/penalty-closing.js';

PenaltyClosing.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();