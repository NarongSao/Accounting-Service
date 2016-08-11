import {Security} from 'meteor/ongoworks:security';
import {Roles} from 'meteor/alanning:roles';

// Setting
Security.defineMethod("Microfis_ifSetting", {
    fetch: [],
    transform: null,
    allow (type, arg, userId) {
        return Roles.userIsInRole(userId, ['setting'], 'Microfis');
    }
});

// Data Entry
Security.defineMethod("Microfis_ifDataInsert", {
    fetch: [],
    transform: null,
    allow (type, arg, userId) {
        return Roles.userIsInRole(userId, ['data-insert'], 'Microfis');
    }
});

Security.defineMethod("Microfis_ifDataUpdate", {
    fetch: [],
    transform: null,
    allow (type, arg, userId) {
        return Roles.userIsInRole(userId, ['data-update'], 'Microfis');
    }
});

Security.defineMethod("Microfis_ifDataRemove", {
    fetch: [],
    transform: null,
    allow (type, arg, userId) {
        return Roles.userIsInRole(userId, ['data-remove'], 'Microfis');
    }
});

// Report
Security.defineMethod("Microfis_ifReporter", {
    fetch: [],
    transform: null,
    allow (type, arg, userId) {
        return Roles.userIsInRole(userId, ['reporter'], 'Microfis');
    }
});
