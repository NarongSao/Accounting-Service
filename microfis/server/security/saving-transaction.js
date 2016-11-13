import '../configs/security.js';

// Collection
import {SavingTransaction} from '../../common/collections/saving-transaction';

SavingTransaction.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

SavingTransaction.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

SavingTransaction.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
