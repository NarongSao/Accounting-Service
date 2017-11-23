import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/common/collections/company.js';
import {Branch} from '../../../../core/common/collections/branch.js';
import {Currency} from '../../../../core/common/collections/currency.js';
import {ExchangeNBC} from '../../../../acc/imports/api/collections/exchangeNBC';
import {Setting} from '../../../../core/common/collections/setting.js';
import {LoanAcc} from '../../../common/collections/loan-acc.js';
import {ProductStatus} from '../../../common/collections/productStatus.js';
import {CreditOfficer} from '../../../common/collections/credit-officer.js';
import {Product} from '../../../common/collections/product.js';
import {Location} from '../../../common/collections/location.js';
import {Fund} from '../../../common/collections/fund.js';


import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

export const loanNetworkInformationReport = new ValidatedMethod({
    name: 'microfis.loanNetworkInformationReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        params: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({params}) {
        if (!this.isSimulation) {
            this.unblock();

            let data = {
                title: {},
                header: {},
                content: [{index: 'No Result'}],
                footer: {}
            };


            /****** Title *****/
            data.title.company = Company.findOne();
            data.title.branch = Branch.findOne();

            /****** Header *****/


            let exchangeData = ExchangeNBC.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.dateTime).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(params.date).format("DD/MM/YYYY");
            header.productId = "All";
            header.locationId = "All";

            header.fundId = "All";
            header.classifyId = "All";
            header.paymentMethod = "All";

            header.repaidFrequency = "All";


            /****** Content *****/

            let settingDoc = Setting.findOne();
            let baseCurrency = settingDoc.baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th rowspan="3" colspan="2">ឈ្មេាះខេត្ត-រាជធានី</th>
                                    <th colspan="5">ចំនួន</th>
                                    <th colspan="4">សមតុល្យឥណទាន</th>
                                </tr>
                                <tr>
                                    <th rowspan="2">ស្នាក់ការកណ្តាល</th>
                                    <th rowspan="2">ខេត្ត-ក្រុង</th>
                                    <th rowspan="2">ខណ្ឌ-ស្រុក</th>
                                    <th rowspan="2">ឃុំ</th>
                                    <th rowspan="2">ភូមិ</th>
                                    
                                    <th rowspan="2">ចំនួនទឹកប្រាក់</th>
                                    <th colspan="3">ចំនួនអ្នកខ្ចី</th>
                                    
                                </tr>
                                <tr>
                                    <th>ប្រុស</th>
                                    <th>ស្រី</th>
                                    <th>សរុប</th>
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


            //Param
            let selector = {};
            if (params.branchId && params.branchId.includes("All") == false) {
                selector.branchId = {$in: params.branchId};
                let branchList = Branch.find({_id: {$in: params.branchId}}, {
                    fields: {
                        enName: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.enName;
                });
                header.branchId = branchList.toString();

            }
            if (params.creditOfficerId && params.creditOfficerId.includes("All") == false) {
                selector.creditOfficerId = {$in: params.creditOfficerId};
                let creditOfficerList = CreditOfficer.find({_id: {$in: params.creditOfficerId}}, {
                    fields: {
                        enName: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.enName;
                });
                header.creditOfficerId = creditOfficerList.toString();

            }


            if (params.currencyId && params.currencyId.includes("All") == false) {
                selector.currencyId = {$in: params.currencyId};
                let currencyList = Currency.find({_id: {$in: params.currencyId}}, {
                    fields: {
                        _id: 1
                    }
                }).fetch().map(function (obj) {
                    return obj._id;
                });
                header.currencyId = currencyList;

            }
            if (params.productId && params.productId.includes("All") == false) {
                selector.productId = {$in: params.productId};
                let productList = Product.find({_id: {$in: params.productId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.productId = productList;

            }

            if (params.locationId && params.locationId.includes("All") == false) {
                selector.locationId = {$in: params.locationId};
                let locationList = Location.find({_id: {$in: params.locationId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.locationId = locationList;

            }

            if (params.fundId && params.fundId.includes("All") == false) {
                selector.fundId = {$in: params.fundId};
                let fundList = Fund.find({_id: {$in: params.fundId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.fundId = fundList;


            }


            if (params.classifyId && params.classifyId.includes("All") == false) {
                // selector.classifyId = {$in: params.classifyId};
                let classifyListOrigin = ProductStatus.find({_id: {$in: params.classifyId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch();

                let classifyList = classifyListOrigin.map(function (obj) {
                    return obj.name;
                });

                header.classifyId = classifyList;
            }


            if (params.repaidFrequency && params.repaidFrequency != "All") {
                selector.repaidFrequency = params.repaidFrequency;
                header.repaidFrequency = params.repaidFrequency;
            }


            let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
            selector.disbursementDate = {$lte: dateParam};
            selector['$or'] = [{status: "Active"},
                {closeDate: {$exists: true, $gt: dateParam}},
                {writeOffDate: {$exists: true, $gt: dateParam}},
                {restructureDate: {$exists: true, $gt: dateParam}},
                {waivedDate: {$exists: true, $gt: dateParam}}
            ];


            data.header = header;

            //All Active Loan in check date

            let i = 1;

            let checkDate = moment(params.date, "DD/MM/YYYY").toDate();

            //Loop Active Loan in check date


            //Get Village

            let loanByProvince = LoanAcc.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "locationId",
                        foreignField: "_id",
                        as: "locationDoc"
                    }
                },
                {$unwind: "$locationDoc"},
                {
                    $group: {
                        _id: {
                            villageCode: "$locationDoc.code"
                        },
                        loanAccList: {
                            $addToSet: "$_id"
                        }
                    }
                }, {

                    $project: {
                        loanAccList: 1,
                        villageCode: "$_id.villageCode",
                        communeCode: {$substr: ["$_id.villageCode", 0, 6]},
                        districtCode: {$substr: ["$_id.villageCode", 0, 4]},
                        provinceCode: {$substr: ["$_id.villageCode", 0, 2]}

                    }
                },
                {
                    $unwind: {path: "$loanAccList", preserveNullAndEmptyArrays: true}
                },

                {
                    $group: {
                        _id: {
                            provinceCode: "$provinceCode"
                        },
                        loanAccList: {
                            $push: "$loanAccList"
                        },
                        districtList: {$push: "$districtCode"},
                        communeList: {$push: "$communeCode"},
                        villageList: {$push: "$villageCode"},

                    }
                },
                {
                    $unwind: {path: "$villageList", preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            villageCode: "$villageList"
                        },
                        districtList: {$last: "$districtList"},
                        communeList: {$last: "$communeList"},
                        loanAccList: {$last: "$loanAccList"}
                    }
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            villageCode: "$villageList"
                        },
                        districtList: {$last: "$districtList"},
                        communeList: {$last: "$communeList"},
                        loanAccList: {$last: "$loanAccList"},
                        villageCount: {$sum: 1}
                    }
                },
                {
                    $unwind: {path: "$communeList", preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            communeList: "$communeList"
                        },
                        districtList: {$last: "$districtList"},
                        villageCount: {$last: "$villageCount"},
                        loanAccList: {$last: "$loanAccList"}
                    }
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            communeList: "$communeList"
                        },
                        districtList: {$last: "$districtList"},
                        loanAccList: {$last: "$loanAccList"},
                        villageCount: {$last: "$villageCount"},
                        communeCount: {$sum: 1}
                    }
                },
                {
                    $unwind: {path: "$districtList", preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            districtList: "$districtList"
                        },

                        villageCount: {$last: "$villageCount"},
                        communeCount: {$last: "$communeCount"},
                        loanAccList: {$last: "$loanAccList"}
                    }
                },
                {
                    $group: {
                        _id: {
                            provinceCode: "$_id.provinceCode",
                            districtList: "$districtList"
                        },

                        loanAccList: {$last: "$loanAccList"},
                        villageCount: {$last: "$villageCount"},
                        communeCount: {$last: "$communeCount"},
                        districtCount: {$sum: 1}
                    }
                }

            ])


            let k = 1;
            let isHeadOffice = 0;
            loanByProvince.forEach(function (dataByProvince) {
                if (dataByProvince) {
                    let provinceDoc = Location.findOne({type: "P", code: dataByProvince._id.provinceCode});

                    if (provinceDoc._id == settingDoc.headOffice) {
                        isHeadOffice = 1;
                    }

                    let numberMale = 0;
                    let numberFemale = 0;
                    let loanOutstanding = 0;
                    dataByProvince.loanAccList.forEach(function (obj) {
                        if (obj) {
                            let loanDoc = LoanAcc.aggregate([
                                {$match: {_id: obj}},
                                {
                                    $lookup: {
                                        from: "microfis_client",
                                        localField: "clientId",
                                        foreignField: "_id",
                                        as: "clientDoc"
                                    }
                                },
                                {$unwind: {path: "$clientDoc", preserveNullAndEmptyArrays: true}},
                                {
                                    $lookup: {
                                        from: "microfis_fund",
                                        localField: "fundId",
                                        foreignField: "_id",
                                        as: "fundDoc"
                                    }
                                },
                                {$unwind: {path: "$fundDoc", preserveNullAndEmptyArrays: true}},
                                {
                                    $lookup: {
                                        from: "microfis_creditOfficer",
                                        localField: "creditOfficerId",
                                        foreignField: "_id",
                                        as: "creditOfficerDoc"
                                    }
                                },
                                {$unwind: {path: "$creditOfficerDoc", preserveNullAndEmptyArrays: true}},
                                {
                                    $lookup: {
                                        from: "microfis_location",
                                        localField: "locationId",
                                        foreignField: "_id",
                                        as: "locationDoc"
                                    }
                                },
                                {$unwind: {path: "$locationDoc", preserveNullAndEmptyArrays: true}},

                                {
                                    $lookup: {
                                        from: "microfis_product",
                                        localField: "productId",
                                        foreignField: "_id",
                                        as: "productDoc"
                                    }
                                },
                                {$unwind: {path: "$productDoc", preserveNullAndEmptyArrays: true}},

                                {
                                    $lookup: {
                                        from: "microfis_fee",
                                        localField: "productDoc.feeId",
                                        foreignField: "_id",
                                        as: "feeDoc"
                                    }
                                },
                                {$unwind: {path: "$feeDoc", preserveNullAndEmptyArrays: true}},

                                {
                                    $lookup: {
                                        from: "microfis_penalty",
                                        localField: "productDoc.penaltyId",
                                        foreignField: "_id",
                                        as: "penaltyDoc"
                                    }
                                },
                                {$unwind: {path: "$penaltyDoc", preserveNullAndEmptyArrays: true}},

                                {
                                    $lookup: {
                                        from: "microfis_penaltyClosing",
                                        localField: "productDoc.penaltyClosingId",
                                        foreignField: "_id",
                                        as: "penaltyClosingDoc"
                                    }
                                },
                                {$unwind: {path: "$penaltyClosingDoc", preserveNullAndEmptyArrays: true}}
                            ]);

                            loanDoc.forEach(function (loanAccDoc) {
                                let result = checkRepayment.run({
                                    loanAccId: loanAccDoc._id,
                                    checkDate: checkDate,
                                    opts: loanAccDoc
                                });

                                if (loanAccDoc.clientDoc.gender == "M") {
                                    numberMale++;
                                } else if (loanAccDoc.clientDoc.gender == "F") {
                                    numberFemale++;
                                }
                                loanOutstanding += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                            });


                        }
                    })

                    content += `
                            <tr>
                                <td>${k}</td>
                                <td>${provinceDoc.khName}</td>
                                <td>${isHeadOffice}</td>
                                <td>1</td>
                                <td  class="numberAlign">${dataByProvince.districtCount}</td>
                                <td class="numberAlign">${dataByProvince.communeCount}</td>
                                <td class="numberAlign">${dataByProvince.villageCount}</td>
                                <td class="numberAlign">${microfis_formatNumber(loanOutstanding)}</td>
                                <td class="numberAlign">${numberMale}</td>  
                                <td class="numberAlign">${numberFemale}</td>
                                <td class="numberAlign">${numberMale + numberFemale}</td>
                                
                            </tr>



                        `

                    k++;
                }
            })

            content += `
                        </tbody>
                      </table>`

            data.content = content;
            return data
        }
    }
});

let microfis_formatDate = function (val) {
    return moment(val).format("DD/MM/YYYY");
}

let microfis_formatNumber = function (val) {
    return numeral(val).format("(0,00.00)");
}

