import '../configs/security.js';

// Collection
import {GroupLoan} from '../../common/collections/groupLoan';

GroupLoan.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();