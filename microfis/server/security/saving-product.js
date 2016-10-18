import '../configs/security.js';

// Collection
import {SavingProduct} from '../../common/collections/saving-product.js';

SavingProduct.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();