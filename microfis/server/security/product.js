import '../configs/security.js';

// Collection
import {Product} from '../../common/collections/product.js';

Product.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();