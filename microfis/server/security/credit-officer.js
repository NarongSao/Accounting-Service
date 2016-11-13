import '../configs/security.js';

// Collection
import {CreditOfficer} from '../../common/collections/credit-officer.js';

CreditOfficer.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

CreditOfficer.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

CreditOfficer.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
