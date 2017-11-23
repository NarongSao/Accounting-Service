import '../configs/security.js';

// Collection
import {Category} from '../../common/collections/category';

Category.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();