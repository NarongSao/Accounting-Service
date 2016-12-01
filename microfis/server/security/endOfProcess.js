import '../configs/security.js';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';

EndOfProcess.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();