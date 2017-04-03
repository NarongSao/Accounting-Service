import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import fx from 'money';

// Collection
import {Location} from '../../common/collections/location.js';
import {Fund} from '../../common/collections/fund.js';
import {Fee} from '../../common/collections/fee.js';
import {Penalty} from '../../common/collections/penalty.js';
import {PenaltyClosing} from '../../common/collections/penalty-closing.js';
import {Client} from '../../common/collections/client.js';
import {Product} from '../../common/collections/product.js';
import {CreditOfficer} from '../../common/collections/credit-officer.js';
import {LoanAcc} from '../../common/collections/loan-acc';

export let SelectOptMethods = {};

// Location
SelectOptMethods.location = new ValidatedMethod({
    name: 'microfis.selectOpts.location',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {code: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ],
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }
            _.assignIn(selector, params);

            let data = Location.aggregate([
                {
                    $match: selector
                },
                {
                    $limit: 10
                },
                {
                    $unwind: {path: "$ancestors", preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "ancestors",
                        foreignField: "_id",
                        as: "ancestorsDoc"
                    }
                },
                {
                    $unwind: {path: "$ancestorsDoc", preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: "$_id",
                        type: {$first: "$type"},
                        parent: {$first: "$parent"},
                        code: {$first: "$code"},
                        name: {$first: "$name"},
                        ancestorsDoc: {$push: "$ancestorsDoc.name"}
                    }
                }
            ]);

            data.forEach(function (value) {
                let label = `${value.code} : `;
                if (_.compact(value.ancestorsDoc).length > 0) {
                    _.forEach(value.ancestorsDoc, (o) => {
                        label += o + ', ';
                    })
                }
                label += value.name;

                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Fund
SelectOptMethods.fund = new ValidatedMethod({
    name: 'microfis.selectOpts.fund',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Fund.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Fee
SelectOptMethods.fee = new ValidatedMethod({
    name: 'microfis.selectOpts.fee',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Fee.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Penalty
SelectOptMethods.penalty = new ValidatedMethod({
    name: 'microfis.selectOpts.penalty',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Penalty.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Penalty Closing
SelectOptMethods.penaltyClosing = new ValidatedMethod({
    name: 'microfis.selectOpts.penaltyClosing',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = PenaltyClosing.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Client
SelectOptMethods.client = new ValidatedMethod({
    name: 'microfis.selectOpts.client',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {khSurname: {$regex: searchText, $options: 'i'}},
                        {khGivenName: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Client.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.khSurname + ', ' + value.khGivenName;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Product
SelectOptMethods.product = new ValidatedMethod({
    name: 'microfis.selectOpts.product',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}},
                        {shortName: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Product.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = `${value._id} : ${value.name} (${value.shortName})`;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Credit Officer
SelectOptMethods.creditOfficer = new ValidatedMethod({
    name: 'microfis.selectOpts.creditOfficer',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {khName: {$regex: searchText, $options: 'i'}},
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = CreditOfficer.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = `${value._id} : ${value.khName}`;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// Location on loanAcc
SelectOptMethods.location = new ValidatedMethod({
    name: 'microfis.selectOpts.locationOnLoanAcc',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {khName: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }
            selector.level = 4;

            let data = Location.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = `${value._id} : ${value.khName}, ${value.parentDoc.khNameCom}, ${value.parentDoc.khNameDis}, ${value.parentDoc.khNamePro}`;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

// LoanAcc
SelectOptMethods.loanAcc = new ValidatedMethod({
    name: 'microfis.selectOpts.loanAccByClient',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            selector.clientId = params.clientId;
            if (searchText) {
                selector = {
                    _id: {$regex: searchText, $options: 'i'}
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = LoanAcc.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = `${value._id} | Dis Date: ` + moment(value.disbursementDate).format('DD/MM/YYYY') + ` | Amount: ${value.currencyId} ` + numeral(value.loanAmount).format('0,0.00');
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});


//Location For Report

Meteor.methods({
    locationForReport(isNotSelectAll){
        if (!this.isSimulation) {
            var list = [];
            if (isNotSelectAll == undefined) {
                list.push({label: "(Select All)", value: "All"});
            }
            let data = Location.aggregate([
                {
                    $match: {type: "V"}
                },
                {
                    $unwind: {path: "$ancestors", preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "ancestors",
                        foreignField: "_id",
                        as: "ancestorsDoc"
                    }
                },
                {
                    $unwind: {path: "$ancestorsDoc", preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: "$_id",
                        type: {$first: "$type"},
                        parent: {$first: "$parent"},
                        code: {$first: "$code"},
                        name: {$first: "$name"},
                        ancestorsDoc: {$push: "$ancestorsDoc.name"}
                    }
                }
            ]);

            data.forEach(function (value) {
                let label = `${value.code} : `;
                if (_.compact(value.ancestorsDoc).length > 0) {
                    _.forEach(value.ancestorsDoc, (o) => {
                        label += o + ', ';
                    })
                }
                label += value.name;

                list.push({label: label, value: value._id});
            });
            return list;
        }
    }
})
