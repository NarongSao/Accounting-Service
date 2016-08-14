import './_init.js';

// Collection
import {SavingProduct} from '../../imports/api/collections/saving-product.js';

SavingProduct.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();