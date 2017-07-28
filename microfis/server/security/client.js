import '../configs/security.js';

// Collection
import {Client} from '../../common/collections/client.js';

Client.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Client.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Client.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
