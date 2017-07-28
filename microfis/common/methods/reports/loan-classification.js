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

export const loanClassificationReport = new ValidatedMethod({
    name: 'microfis.loanClassificationReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        params: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({params}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

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
            let date = params.date;
            let fDate = moment(date[0], 'DD/MM/YYYY').startOf("days").toDate();
            let tDate = moment(date[1], 'DD/MM/YYYY').endOf("days").toDate();


            let exchangeData = ExchangeNBC.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.dateTime).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(fDate).format("DD/MM/YYYY") + " - " + moment(tDate).format("DD/MM/YYYY");
            header.productId = "All";
            header.locationId = "All";

            header.fundId = "All";
            header.repaidFrequency = "All";


            /****** Content *****/
            let startDate = moment(tDate).startOf("year").toDate();

            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>ការធ្វើចំណាត់ថ្នាក់</th>
                                    <th>ចំនួនឥណទាន</th>
                                    <th>ចំនួនទឹកប្រាក់</th>
                                    <th>សំវិធានធន</th>
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


            //Param
            let selector = {};
            let selectorWriteOff = {};
            if (params.branchId && params.branchId.includes("All") == false) {
                selector.branchId = {$in: params.branchId};
                selectorWriteOff.branchId = {$in: params.branchId};
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
                selectorWriteOff.creditOfficerId = {$in: params.creditOfficerId};
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
                selectorWriteOff.currencyId = {$in: params.currencyId};
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
                selectorWriteOff.productId = {$in: params.productId};
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
                selectorWriteOff.locationId = {$in: params.locationId};
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
                selectorWriteOff.fundId = {$in: params.fundId};
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

            if (params.repaidFrequency && params.repaidFrequency != "All") {
                selector.repaidFrequency = params.repaidFrequency;
                selectorWriteOff.repaidFrequency = params.repaidFrequency;
                header.repaidFrequency = params.repaidFrequency;
            }


            selector.disbursementDate = {$lte: tDate};
            selector['$or'] = [{status: "Active"},
                {closeDate: {$exists: true, $gt: tDate}},
                {writeOffDate: {$exists: true, $gt: tDate}},
                {restructureDate: {$exists: true, $gt: tDate}},
                {waivedDate: {$exists: true, $gt: tDate}}
            ];

            selectorWriteOff.disbursementDate = {$lte: tDate};
            selectorWriteOff['$and'] = [{status: "Write Off"},
                {writeOffDate: {$exists: true, $lte: tDate, $gte: startDate}}
            ];


            data.header = header;

            //All Active Loan in check date

            let i = 1;

            let checkDate = tDate;

            //Loop Active Loan in check date


            let loanDoc = LoanAcc.aggregate([
                {$match: selector},
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


            let standardLessOneYear = 0;
            let subStandardLessOneYear = 0;
            let doubtfulLessOneYear = 0;
            let lossLessOneYear = 0;

            let standardOverOneYear = 0;
            let subStandardOverOneYear = 0;
            let doubtfulOverOneYear = 0;
            let lossOverOneYear = 0;

            let totalLessOneYear = 0;
            let totalOverOneYear = 0;


            let numberStandardLessOneYear = 0;
            let numberSubStandardLessOneYear = 0;
            let numberDoubtfulLessOneYear = 0;
            let numberLossLessOneYear = 0;

            let numberStandardOverOneYear = 0;
            let numberSubStandardOverOneYear = 0;
            let numberDoubtfulOverOneYear = 0;
            let numberLossOverOneYear = 0;

            let totalNumberLessOneYear = 0;
            let totalNumberOverOneYear = 0;


            let provisionStandardLessOneYear = 0;
            let provisionSubStandardLessOneYear = 0;
            let provisionDoubtfulLessOneYear = 0;
            let provisionLossLessOneYear = 0;

            let provisionStandardOverOneYear = 0;
            let provisionSubStandardOverOneYear = 0;
            let provisionDoubtfulOverOneYear = 0;
            let provisionLossOverOneYear = 0;

            let totalProvisionLessOneYear = 0;
            let totalProvisionOverOneYear = 0;


            loanDoc.forEach(function (loanAccDoc) {
                if (loanAccDoc) {

                    let result = checkRepayment.run({
                        loanAccId: loanAccDoc._id,
                        checkDate: checkDate,
                        opts: loanAccDoc
                    });

                    let productStatusList;

                    if (loanAccDoc.paymentMethod == "D") {
                        if (loanAccDoc.term <= 365) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }

                    } else if (loanAccDoc.paymentMethod == "W") {
                        if (loanAccDoc.term <= 52) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }
                    } else if (loanAccDoc.paymentMethod == "M") {
                        if (loanAccDoc.term <= 12) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }
                    } else {
                        productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                    }


                    let finProductStatus = function (obj) {
                        return (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) >= obj.from && (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) <= obj.to;
                    }
                    let proStatus = productStatusList.find(finProductStatus);


                    if (loanAccDoc.paymentMethod == "D") {
                        if (loanAccDoc.term <= 365) {
                            if (proStatus.code == "S") {
                                standardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardLessOneYear++;

                                provisionStandardLessOneYear = standardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardLessOneYear++;
                                provisionSubStandardLessOneYear = subStandardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "D") {
                                doubtfulLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulLessOneYear++;
                                provisionDoubtfulLessOneYear = doubtfulLessOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossLessOneYear++;
                                provisionLossLessOneYear = lossLessOneYear * proStatus.provision / 100;
                            }

                        } else {
                            if (proStatus.code == "S") {
                                standardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardOverOneYear++;
                                provisionStandardOverOneYear = standardOverOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardOverOneYear++;
                                provisionSubStandardOverOneYear = subStandardOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "D") {
                                doubtfulOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulOverOneYear++;
                                provisionDoubtfulOverOneYear = doubtfulOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossOverOneYear++;
                                provisionLossOverOneYear = lossOverOneYear * proStatus.provision / 100;
                            }
                        }
                    } else if (loanAccDoc.paymentMethod == "W") {

                        if (loanAccDoc.term <= 52) {
                            if (proStatus.code == "S") {
                                standardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardLessOneYear++;
                                provisionStandardLessOneYear = standardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardLessOneYear++;
                                provisionSubStandardLessOneYear = subStandardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "D") {
                                doubtfulLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulLessOneYear++;
                                provisionDoubtfulLessOneYear = doubtfulLessOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossLessOneYear++;
                                provisionLossLessOneYear = lossLessOneYear * proStatus.provision / 100;
                            }
                        } else {
                            if (proStatus.code == "S") {
                                standardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardOverOneYear++;
                                provisionStandardOverOneYear = standardOverOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardOverOneYear++;
                                provisionSubStandardOverOneYear = subStandardOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "D") {
                                doubtfulOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulOverOneYear++;
                                provisionDoubtfulOverOneYear = doubtfulOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossOverOneYear++;
                                provisionLossOverOneYear = lossOverOneYear * proStatus.provision / 100;
                            }
                        }
                    } else if (loanAccDoc.paymentMethod == "M") {
                        if (loanAccDoc.term <= 12) {
                            if (proStatus.code == "S") {
                                standardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardLessOneYear++;
                                provisionStandardLessOneYear = standardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardLessOneYear++;
                                provisionSubStandardLessOneYear = subStandardLessOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "D") {
                                doubtfulLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulLessOneYear++;
                                provisionDoubtfulLessOneYear = doubtfulLessOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossLessOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossLessOneYear++;
                                provisionLossLessOneYear = lossLessOneYear * proStatus.provision / 100;
                            }
                        } else {
                            if (proStatus.code == "S") {
                                standardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberStandardOverOneYear++;
                                provisionStandardOverOneYear = standardOverOneYear * proStatus.provision / 100;

                            } else if (proStatus.code == "U") {
                                subStandardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberSubStandardOverOneYear++;
                                provisionSubStandardOverOneYear = subStandardOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "D") {
                                doubtfulOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberDoubtfulOverOneYear++;
                                provisionDoubtfulOverOneYear = doubtfulOverOneYear * proStatus.provision / 100;
                            } else if (proStatus.code == "W") {
                                lossOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                numberLossOverOneYear++;
                                provisionLossOverOneYear = lossOverOneYear * proStatus.provision / 100;
                            }
                        }
                    } else {
                        if (proStatus.code == "S") {
                            standardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                            numberStandardOverOneYear++;
                            provisionStandardOverOneYear = standardOverOneYear * proStatus.provision / 100;

                        } else if (proStatus.code == "U") {
                            subStandardOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                            numberSubStandardOverOneYear++;
                            provisionSubStandardOverOneYear = subStandardOverOneYear * proStatus.provision / 100;
                        } else if (proStatus.code == "D") {
                            doubtfulOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                            numberDoubtfulOverOneYear++;
                            provisionDoubtfulOverOneYear = doubtfulOverOneYear * proStatus.provision / 100;
                        } else if (proStatus.code == "W") {
                            lossOverOneYear += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                            numberLossOverOneYear++;
                            provisionLossOverOneYear = lossOverOneYear * proStatus.provision / 100;
                        }
                    }


                }
            })


            totalProvisionLessOneYear = provisionStandardLessOneYear + provisionSubStandardLessOneYear + provisionDoubtfulLessOneYear + provisionLossLessOneYear;
            totalProvisionOverOneYear = provisionStandardOverOneYear + provisionSubStandardOverOneYear + provisionDoubtfulOverOneYear + provisionLossOverOneYear;


            totalNumberLessOneYear = numberStandardLessOneYear + numberSubStandardLessOneYear + numberDoubtfulLessOneYear + numberLossLessOneYear;
            totalLessOneYear = standardLessOneYear + subStandardLessOneYear + doubtfulLessOneYear + lossLessOneYear;

            totalNumberOverOneYear = numberStandardOverOneYear + numberSubStandardOverOneYear + numberDoubtfulOverOneYear + numberLossOverOneYear;
            totalOverOneYear = standardOverOneYear + subStandardOverOneYear + doubtfulOverOneYear + lossOverOneYear;

            let nonActiveRatio = 0;

            if (totalLessOneYear + totalOverOneYear > 0) {
                nonActiveRatio = (totalLessOneYear + totalOverOneYear - standardLessOneYear - standardOverOneYear) * 100 / (totalLessOneYear + totalOverOneYear);
            }


            //Loan Write OFF

            let loanDocWriteOff = LoanAcc.aggregate([
                {$match: selectorWriteOff},
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


            let writeOffDuration = 0;
            let writeOffFromStartDate = 0;

            if (loanDocWriteOff) {
                loanDocWriteOff.forEach(function (loanAccDocWriteOff) {
                    let result = checkRepayment.run({
                        loanAccId: loanAccDocWriteOff._id,
                        checkDate: checkDate,
                        opts: loanAccDocWriteOff
                    });

                    writeOffFromStartDate += Meteor.call('exchangeNBC', loanAccDocWriteOff.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                    if (loanAccDocWriteOff.writeOffDate >= fDate) {
                        writeOffDuration += Meteor.call('exchangeNBC', loanAccDocWriteOff.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                    }

                })
            }


            content += `
                        <tr>
                            <th colspan="4">១. ឥណទានមានឥណប្រតិទាន ១ឆ្នាំ ឬតិចជាង ១ឆ្នាំ</th>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.១. ស្តង់ដារ</td>    
                            <td class="numberAlign">${numberStandardLessOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(standardLessOneYear)}</td>    
                            <td class="numberAlign">${microfis_formatNumber(provisionStandardLessOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.២. ក្រោមស្តងដារ ហួសកាលកំណត់សង ៣០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberSubStandardLessOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(subStandardLessOneYear)}</td>       
                            <td class="numberAlign">${microfis_formatNumber(provisionSubStandardLessOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.៣. សង្ស័យ ហួសកាលកំណត់សង ៦០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberDoubtfulLessOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(doubtfulLessOneYear)}</td>       
                            <td class="numberAlign">${microfis_formatNumber(provisionDoubtfulLessOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.៤. បាត់បង់ ហួសកាលកំណត់សង ៩០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberLossLessOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(lossLessOneYear)}</td>       
                            <td class="numberAlign">${microfis_formatNumber(provisionLossLessOneYear)}</td>    
                        </tr>  
                        <tr>
                            <th>សរុប(១)</th>
                            <td class="numberAlign">${totalNumberLessOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(totalLessOneYear)}</td>    
                            <td class="numberAlign">${microfis_formatNumber(totalProvisionLessOneYear)}</td>
                        </tr>
                       
                       
                       
                       

                        <tr>
                            <th colspan="4">២. ឥណទានមានឥណប្រតិទានលើសពី ១ឆ្នាំ</th>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;២.១. ស្តង់ដារ</td>    
                            <td class="numberAlign">${numberStandardOverOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(standardOverOneYear)}</td>       
                            <td class="numberAlign">${microfis_formatNumber(provisionStandardOverOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.២. ក្រោមស្តងដារ ហួសកាលកំណត់សង ៣០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberSubStandardOverOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(subStandardOverOneYear)}</td>        
                            <td class="numberAlign">${microfis_formatNumber(provisionSubStandardOverOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.៣. សង្ស័យ ហួសកាលកំណត់សង ១៨០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberDoubtfulOverOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(doubtfulOverOneYear)}</td>        
                            <td class="numberAlign">${microfis_formatNumber(provisionDoubtfulOverOneYear)}</td>    
                        </tr>    
                        <tr>
                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;១.៤. បាត់បង់ ហួសកាលកំណត់សង ៣៦០ថ្ងៃ</td>    
                            <td class="numberAlign">${numberLossOverOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(lossOverOneYear)}</td>       
                            <td class="numberAlign">${microfis_formatNumber(provisionLossOverOneYear)}</td>    
                        </tr>  
                        <tr>
                            <th>សរុប(២​)</th>
                            <td class="numberAlign">${totalNumberOverOneYear}</td>    
                            <td class="numberAlign">${microfis_formatNumber(totalOverOneYear)}</td>    
                            <td class="numberAlign">${microfis_formatNumber(totalProvisionOverOneYear)}</td>
                        </tr>
                        <tr>
                            <th>៤. សរុបសមតុល្យឥណទាន (៤ = ១ + ២)</th>
                            <th class="numberAlign" colspan="3">${microfis_formatNumber(totalLessOneYear + totalOverOneYear)}</th>
                        </tr>
                        <tr>
                            <th>៥. សរុបសមតុល្យឥណទានហួសកាលកំណត់សង ៣០ថ្ងៃ (៥ = ៤ - (១.១ + ២.១))</th>
                            <th class="numberAlign"  colspan="3">${microfis_formatNumber(totalLessOneYear + totalOverOneYear - standardLessOneYear - standardOverOneYear)}</th>
                        </tr>
                        <tr>
                            <th>៦. អនុបាតឥណទានមិនដំណើរការ (៦ = ៥ / ៤)</th>
                            <th   class="numberAlign"  colspan="3">${microfis_formatNumber(nonActiveRatio)}%</th>
                        </tr>
                        <tr style="border: 0px !important">
                                <th style="border: 0px !important">
                                    <span>ឥណទានលុបចោល ៖</span><span style="float:right !important">ក្នុងគ្រា៖</span>
                                </th>
                                <td style="border: 0px !important">
                                    ${microfis_formatNumber(writeOffDuration)}
                                </td>
                                <th style="text-align: right;border: 0px !important">
                                    បង្គរពីដើមឆ្នាំ ៖
                                </th>
                                <td style="border: 0px !important">
                                    ${microfis_formatNumber(writeOffFromStartDate)}
                                </td>
                        </tr>
                        
                    
                    `


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

