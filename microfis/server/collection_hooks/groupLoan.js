import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {GroupLoan} from '../../common/collections/groupLoan';
import {LoanAcc} from '../../common/collections/loan-acc';
import {Group} from '../../common/collections/group';

GroupLoan.before.insert(function (userId, doc) {
    let prefix = doc.branchId + "-" + moment(doc.date).format("YYYY");

    var year = moment(doc.date).format("YYYY");
    doc.code = doc.branchId + "-" + year + s.pad(doc.code, 6, "0");

    doc._id = idGenerator2.genWithPrefix(GroupLoan, {
        prefix: prefix,
        length: 6
    });
});

GroupLoan.after.insert(function (userId, doc) {
    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: true}},{multi: true});
    })


    Group.direct.update({_id: doc.groupId}, {$set: {status: true}},{multi: true});

})

GroupLoan.after.remove(function (userId, doc) {
    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: false}},{multi: true});
    })
    Group.direct.update({_id: doc.groupId}, {$set: {status: false}},{multi: true});
})


GroupLoan.after.update(function (userId, doc) {
    let data = this.previous;
    data.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: false}},{multi: true});
    })

    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: true}},{multi: true});
    })


    Group.direct.update({_id: doc.groupId}, {$set: {status: true}},{multi: true});

})

