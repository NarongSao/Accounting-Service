import '../configs/security.js';

// Collection
import {Group} from '../../common/collections/group';

Group.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();