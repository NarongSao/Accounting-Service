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

export const loanBreakDownByPurposeReport = new ValidatedMethod({
    name: 'microfis.loanBreakDownByPurposeReport',
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


            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th rowspan="3">ប្រភេទ</th>
                                    <th colspan="2">ឥណទានក្រុម</th>
                                    <th colspan="2">ឥណទានឯកត្តជន</th>
                                   
                                    <th colspan="2">សរុប</th>
                                </tr>
                                <tr>
                                    <th>ចំនួនគណនី</th>
                                    <th>សមតុល្យឥណទាន</th>
                                    <th>ចំនួនគណនី</th>
                                    <th>សមតុល្យឥណទាន</th>
                                  
                                    <th>ចំនួនគណនី</th>
                                    <th>សមតុល្យឥណទាន</th>
                                </tr>
                                <tr>
                                    <th>1</th>
                                    <th>2</th>
                                    <th>3</th>
                                    <th>4</th>
                                   
                                    
                                    <th>5=1+3</th>
                                    <th>6=2+4</th>
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


            let numberAgriculterGroup = 0;
            let numberAgriculterIndividual = 0;
            let numberAgriculterTotal = 0;

            let numberBusinessGroup = 0;
            let numberBusinessIndividual = 0;
            let numberBusinessTotal = 0;

            let numberServiceGroup = 0;
            let numberServiceIndividual = 0;
            let numberServiceTotal = 0;

            let numberConstructGroup = 0;
            let numberConstructIndividual = 0;
            let numberConstructTotal = 0;

            let numberFamilyGroup = 0;
            let numberFamilyIndividual = 0;
            let numberFamilyTotal = 0;

            let numberOtherGroup = 0;
            let numberOtherIndividual = 0;
            let numberOtherTotal = 0;

            let numberTotalGroup = 0;
            let numberTotalIndividual = 0;
            let numberTotalTotal = 0;


            let balanceAgriculterGroup = 0;
            let balanceAgriculterIndividual = 0;
            let balanceAgriculterTotal = 0;

            let balanceBusinessGroup = 0;
            let balanceBusinessIndividual = 0;
            let balanceBusinessTotal = 0;

            let balanceServiceGroup = 0;
            let balanceServiceIndividual = 0;
            let balanceServiceTotal = 0;

            let balanceConstructGroup = 0;
            let balanceConstructIndividual = 0;
            let balanceConstructTotal = 0;

            let balanceFamilyGroup = 0;
            let balanceFamilyIndividual = 0;
            let balanceFamilyTotal = 0;

            let balanceOtherGroup = 0;
            let balanceOtherIndividual = 0;
            let balanceOtherTotal = 0;

            let balanceTotalGroup = 0;
            let balanceTotalIndividual = 0;
            let balanceTotalTotal = 0;


            let totalRateIndividual = 0;
            let totalRateGroup = 0;
            let totalRate = 0;

            let averageRateIndividual = 0;
            let averageRateGroup = 0;
            let averageRate = 0;


            loanDoc.forEach(function (loanAccDoc) {
                if (loanAccDoc) {

                    let result = checkRepayment.run({
                        loanAccId: loanAccDoc._id,
                        checkDate: checkDate,
                        opts: loanAccDoc
                    });
                    let productStatusList;

                    let coefficient = 1;

                    if (loanAccDoc.paymentMethod == "D") {
                        if (loanAccDoc.term <= 365) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }
                        coefficient = 30;

                    } else if (loanAccDoc.paymentMethod == "W") {
                        if (loanAccDoc.term <= 52) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }
                        coefficient = 4;

                    } else if (loanAccDoc.paymentMethod == "M") {
                        if (loanAccDoc.term <= 12) {
                            productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                        } else {
                            productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        }
                        coefficient = 1;
                    } else {
                        productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                        coefficient = 1 / 12;
                    }


                    let checkClassify = true;
                    if (params.classifyId && params.classifyId.includes("All") == false) {
                        checkClassify = false;
                    }


                    let finProductStatus = function (obj) {
                        return (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) >= obj.from && (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) <= obj.to;
                    }
                    let proStatus = productStatusList.find(finProductStatus);


                    //check product status (Classify)
                    if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {
                        if (loanAccDoc.purpose == "Agriculture") {

                            if (loanAccDoc.accountType == "IL") {
                                numberAgriculterIndividual++;
                                balanceAgriculterIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;

                            } else if (loanAccDoc.accountType == "GL") {
                                numberAgriculterGroup++;
                                balanceAgriculterGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }

                        } else if (loanAccDoc.purpose == "Business") {

                            if (loanAccDoc.accountType == "IL") {
                                numberBusinessIndividual++;
                                balanceBusinessIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;
                            } else if (loanAccDoc.accountType == "GL") {
                                numberBusinessGroup++;
                                balanceBusinessGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }


                        } else if (loanAccDoc.purpose == "Service") {

                            if (loanAccDoc.accountType == "IL") {
                                numberServiceIndividual++;
                                balanceServiceIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;
                            } else if (loanAccDoc.accountType == "GL") {
                                numberServiceGroup++;
                                balanceServiceGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }


                        } else if (loanAccDoc.purpose == "Construction") {

                            if (loanAccDoc.accountType == "IL") {
                                numberConstructIndividual++;
                                balanceConstructIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;
                            } else if (loanAccDoc.accountType == "GL") {
                                numberConstructGroup++;
                                balanceConstructGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }

                        } else if (loanAccDoc.purpose == "Family") {

                            if (loanAccDoc.accountType == "IL") {
                                numberFamilyIndividual++;
                                balanceFamilyIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;
                            } else if (loanAccDoc.accountType == "GL") {
                                numberFamilyGroup++;
                                balanceFamilyGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }


                        } else if (loanAccDoc.purpose == "Other") {

                            if (loanAccDoc.accountType == "IL") {
                                numberOtherIndividual++;
                                balanceOtherIndividual += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);

                                totalRateIndividual += coefficient * loanAccDoc.interestRate;
                            } else if (loanAccDoc.accountType == "GL") {
                                numberOtherGroup++;
                                balanceOtherGroup += Meteor.call('exchangeNBC', loanAccDoc.currencyId, "KHR", result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                                totalRateGroup += coefficient * loanAccDoc.interestRate;
                            }


                        }
                    }


                }
            })

            numberAgriculterTotal = numberAgriculterGroup + numberAgriculterIndividual;
            numberBusinessTotal = numberBusinessGroup + numberBusinessIndividual;
            numberServiceTotal = numberServiceGroup + numberServiceIndividual;
            numberConstructTotal = numberConstructGroup + numberConstructIndividual;
            numberFamilyTotal = numberFamilyGroup + numberFamilyIndividual;
            numberOtherTotal = numberOtherGroup + numberOtherIndividual;


            numberTotalGroup = numberAgriculterGroup + numberBusinessGroup + numberServiceGroup + numberConstructGroup + numberFamilyGroup + numberOtherGroup;
            numberTotalIndividual = numberAgriculterIndividual + numberBusinessIndividual + numberServiceIndividual + numberConstructIndividual + numberFamilyIndividual + numberOtherIndividual;
            numberTotalTotal = numberTotalGroup + numberTotalIndividual;


            balanceAgriculterTotal = balanceAgriculterGroup + balanceAgriculterIndividual;
            balanceBusinessTotal = balanceBusinessGroup + balanceBusinessIndividual;
            balanceServiceTotal = balanceServiceGroup + balanceServiceIndividual;
            balanceConstructTotal = balanceConstructGroup + balanceConstructIndividual;
            balanceFamilyTotal = balanceFamilyGroup + balanceFamilyIndividual;
            balanceOtherTotal = balanceOtherGroup + balanceOtherIndividual;
            balanceTotalTotal = balanceTotalGroup + balanceTotalIndividual;

            balanceTotalGroup = balanceAgriculterGroup + balanceBusinessGroup + balanceServiceGroup + balanceConstructGroup + balanceFamilyGroup + balanceOtherGroup;
            balanceTotalIndividual = balanceAgriculterIndividual + balanceBusinessIndividual + balanceServiceIndividual + balanceConstructIndividual + balanceFamilyIndividual + balanceOtherIndividual;
            balanceTotalTotal = balanceTotalGroup + balanceTotalIndividual;


            if (totalRateGroup > 0) {

                averageRateGroup = totalRateGroup / numberTotalGroup;
            }

            if (totalRateIndividual > 0) {
                averageRateIndividual = totalRateIndividual / numberTotalIndividual;
            }

            let k = 0;
            if (averageRateIndividual > 0) {
                k++;
            }

            if (averageRateGroup > 0) {
                k++;
            }


            if (averageRateIndividual + averageRateGroup > 0) {
                averageRate = (averageRateIndividual + averageRateGroup) / k;
            }


            content += `
                        <tr>
                            <td>កសិកម្ម</td>
                            <td class="numberAlign">${numberAgriculterGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceAgriculterGroup)}</td>
                            <td class="numberAlign">${numberAgriculterIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceAgriculterIndividual)}</td>
                            <td class="numberAlign">${numberAgriculterTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceAgriculterTotal)}</td>
                        </tr>
                        <tr>
                            <td>ពាណិជ្ជកម្ម</td>
                            <td class="numberAlign">${numberBusinessGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceBusinessGroup)}</td>
                            <td class="numberAlign">${numberBusinessIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceBusinessIndividual)}</td>
                            <td class="numberAlign">${numberBusinessTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceBusinessTotal)}</td>
                        </tr>
                        <tr>
                            <td>សេវាកម្ម</td>
                            <td class="numberAlign">${numberServiceGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceServiceGroup)}</td>
                            <td class="numberAlign">${numberServiceIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceServiceIndividual)}</td>
                            <td class="numberAlign">${numberServiceTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceServiceTotal)}</td>
                        </tr>
                        <tr>
                            <td>សំណង់</td>
                            <td class="numberAlign">${numberConstructGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceConstructGroup)}</td>
                            <td class="numberAlign">${numberConstructIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceConstructIndividual)}</td>
                            <td class="numberAlign">${numberConstructTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceConstructTotal)}</td>
                        </tr>
                        <tr>
                            <td>ក្រុមគ្រួសារ</td>
                            <td class="numberAlign">${numberFamilyGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceFamilyGroup)}</td>
                            <td class="numberAlign">${numberFamilyIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceFamilyIndividual)}</td>
                            <td class="numberAlign">${numberFamilyTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceFamilyTotal)}</td>
                        </tr>
                        <tr>
                            <td>ផ្សេងៗ</td>
                            <td class="numberAlign">${numberOtherGroup}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceOtherGroup)}</td>
                            <td class="numberAlign">${numberOtherIndividual}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceOtherIndividual)}</td>
                            <td class="numberAlign">${numberOtherTotal}</td>
                            <td class="numberAlign">${microfis_formatNumber(balanceOtherTotal)}</td>
                        </tr>
                        
                        <tr>
                            <th>សរុប</th>
                            <th class="numberAlign">${numberTotalGroup}</th>
                            <th class="numberAlign">${microfis_formatNumber(balanceTotalGroup)}</th>
                            <th class="numberAlign">${numberTotalIndividual}</th>
                            <th class="numberAlign">${microfis_formatNumber(balanceTotalIndividual)}</th>
                            <th class="numberAlign">${numberTotalTotal}</th>
                            <th class="numberAlign">${microfis_formatNumber(balanceTotalTotal)}</th>
                        </tr>   
                        <tr>
                            <th>អត្រាការប្រាក់ដែលបានយក</th>
                            <th colspan="2"  class="numberAlign">${microfis_formatNumber(averageRateGroup)}%</th>
                            <th colspan="2"  class="numberAlign">${microfis_formatNumber(averageRateIndividual)}%</th>
                            <th colspan="2"  class="numberAlign">${microfis_formatNumber(averageRate)}%</th>
                        </tr>

                    `;


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

