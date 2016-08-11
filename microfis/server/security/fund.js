import './_init.js';

// Collection
import {Fund} from '../../imports/api/collections/fund.js';

Fund.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();