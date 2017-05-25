/**
 * Created by narong on 5/19/17.
 */

import {Location} from "../../common/collections/location";

export default class LocationClass {
    static getLocationByVillage(villageId) {
        let village = Location.findOne({_id: villageId});
        let district = Location.findOne({_id: village.parent});
        let commune = Location.findOne({_id: district.parent});
        let province = Location.findOne({_id: commune.parent});

        return village._id + " | " + province.khName + " | " + commune.khName + " | " + district.khName + " | " + village.khName;
    }
}
