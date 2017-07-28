import '../configs/security.js';

// Collection
import {Group} from '../../common/collections/group';



Group.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Group.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Group.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();