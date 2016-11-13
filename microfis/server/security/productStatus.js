import '../configs/security.js';

// Collection
import {ProductStatus} from '../../common/collections/productStatus';

ProductStatus.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();