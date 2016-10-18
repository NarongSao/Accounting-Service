import '../configs/security.js';

// Collection
import {SavingAcc} from '../../common/collections/saving-acc';

SavingAcc.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

SavingAcc.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

SavingAcc.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
