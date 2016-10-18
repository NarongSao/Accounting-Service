import '../configs/security.js';

// Collection
import {Repayment} from '../../common/collections/repayment.js';

Repayment.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Repayment.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Repayment.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
