import '../configs/security.js';

// Collection
import {ChangeCO} from '../../common/collections/changeCO';


ChangeCO.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

ChangeCO.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

ChangeCO.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();

