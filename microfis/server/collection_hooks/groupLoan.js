import 'meteor/matb33:collection-hooks';
import {idGenerator2} from 'meteor/theara:id-generator';
import {_} from 'meteor/erasaur:meteor-lodash';

// Collection
import {GroupLoan} from '../../common/collections/groupLoan';
import {LoanAcc} from '../../common/collections/loan-acc';

GroupLoan.before.insert(function (userId, doc) {
    let prefix = moment(doc.date).format("YYYY");

    var year = moment(doc.date).format("YYYY");
    doc.code = doc.branchId + "-" + year + s.pad(doc.code, 6, "0");

    doc._id = idGenerator2.genWithPrefix(GroupLoan, {
        prefix: prefix,
        length: 6
    });
});

GroupLoan.after.insert(function (userId, doc) {
    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: true}});
    })

})

GroupLoan.after.remove(function (userId, doc) {
    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: false}});
    })
})


GroupLoan.after.update(function (userId, doc) {
    let data = this.previous;
    data.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: false}});
    })

    doc.loan.forEach(function (obj) {
        LoanAcc.direct.update({_id: obj.id}, {$set: {isAddToGroup: true}});
    })
})

