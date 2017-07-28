import '../configs/security.js';

// Collection
import {EndOfProcess} from '../../common/collections/endOfProcess.js';



EndOfProcess.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

EndOfProcess.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

EndOfProcess.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();