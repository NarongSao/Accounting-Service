import '../configs/security.js';

// Collection
import {GroupLoan} from '../../common/collections/groupLoan';



GroupLoan.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

GroupLoan.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

GroupLoan.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();