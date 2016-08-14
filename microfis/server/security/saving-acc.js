import './_init.js';

// Collection
import {SavingAcc} from '../../imports/api/collections/saving-acc';

SavingAcc.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

SavingAcc.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

SavingAcc.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
