import '../configs/security.js';

// Collection
import {Purchase} from '../../common/collections/purchase';

Purchase.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Purchase.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Purchase.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();