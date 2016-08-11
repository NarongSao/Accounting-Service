import './_init.js';

// Collection
import {Guarantor} from '../../imports/api/collections/guarantor.js';

Guarantor.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Guarantor.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Guarantor.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
