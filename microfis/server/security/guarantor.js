import '../configs/security.js';

// Collection
import {Guarantor} from '../../common/collections/guarantor.js';

Guarantor.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Guarantor.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Guarantor.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
