import './_init.js';

// Collection
import {Product} from '../../imports/api/collections/product.js';

Product.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();