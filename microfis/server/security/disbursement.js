import './_init.js';

// Collection
import {Disbursement} from '../../imports/api/collections/disbursement.js';

Disbursement.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Disbursement.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Disbursement.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
