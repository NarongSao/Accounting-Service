import '../configs/security.js';

// Collection
import {GroupCategory} from '../../common/collections/groupCategory';

GroupCategory.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();