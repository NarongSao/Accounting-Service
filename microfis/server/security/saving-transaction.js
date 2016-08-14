import './_init.js';

// Collection
import {SavingTransaction} from '../../imports/api/collections/saving-transaction';

SavingTransaction.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

SavingTransaction.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

SavingTransaction.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
