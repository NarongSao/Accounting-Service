import '../configs/security.js';

// Collection
import {ClearPrepay} from '../../common/collections/clearPrepay';



ClearPrepay.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

ClearPrepay.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

ClearPrepay.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();