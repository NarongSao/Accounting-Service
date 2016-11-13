import '../configs/security.js';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';

LoanAcc.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

LoanAcc.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

LoanAcc.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
