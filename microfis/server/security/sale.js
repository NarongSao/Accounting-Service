import '../configs/security.js';

// Collection
import {Sale} from '../../common/collections/sale';


Sale.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Sale.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Sale.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
