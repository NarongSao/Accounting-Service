import './_init.js';

// Collection
import {Client} from '../../imports/api/collections/client.js';

Client.permit(['insert'])
    .Microfis_ifDataInsert()
    .allowInClientCode();

Client.permit(['update'])
    .Microfis_ifDataUpdate()
    .allowInClientCode();

Client.permit(['remove'])
    .Microfis_ifDataRemove()
    .allowInClientCode();
