import {Accounts} from 'meteor/accounts-base';

// Add new custom field
Accounts.onCreateUser(function (options, user) {
    user.profile = options.profile;
    user.rolesBranch = options.rolesBranch;
    
    return user;
});


/*Accounts.config({
    loginExpirationInDays: 0.0208
});*/


