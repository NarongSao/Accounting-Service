import '../configs/security.js';

// Collection
import {Fund} from '../../common/collections/fund.js';

Fund.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();