import '../configs/security.js';

// Collection
import {PaymentStatus} from '../../common/collections/paymentStatus.js';

PaymentStatus.permit(['insert', 'update', 'remove'])
    .Microfis_ifSetting()
    .allowInClientCode();