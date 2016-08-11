import './_init.js';

// Collection
import {Repayment} from '../../imports/api/collections/repayment.js';

Repayment.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Repayment.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Repayment.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
