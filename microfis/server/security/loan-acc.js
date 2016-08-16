import './_init.js';

// Collection
import {LoanAcc} from '../../imports/api/collections/loan-acc.js';

LoanAcc.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

LoanAcc.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

LoanAcc.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
