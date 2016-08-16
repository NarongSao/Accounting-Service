import {Template} from 'meteor/templating';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';


// Component
import '../../../../core/client/components/loading.js';

// Collection
import {Client} from '../../api/collections/client.js';


// Page
import './client-acc.html';
import './loan-acc';
import './saving-acc';

// Declare template
let indexTmpl = Template.Microfis_clientAcc;

indexTmpl.helpers({
    data(){
        let clientId = FlowRouter.getParam('clientId');
        let data = Client.findOne(clientId);
        data.photoUrl = null;
        if (data.photo) {
            let photo = Files.findOne(data.photo);
            data.photoUrl = photo.url();
        }

        return data;
    }
});
