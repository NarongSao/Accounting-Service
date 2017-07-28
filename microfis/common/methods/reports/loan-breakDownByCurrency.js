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

export const loanBreakDownByCurrencyReport = new ValidatedMethod({
    name: 'microfis.loanBreakDownByCurrencyReport',
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
                                    <th>ប្រភេទរូបិយប័ណ្ណ</th>
                                    <th>ចំនួនឥណទាន</th>
                                    <th>ចំនួនទឹកប្រាក់តាមប្រភេទរូបិយប័ណ្ណ</th>
                                    <th>ចំនួនទឹកប្រាក់គិតជារៀល</th>
                                    <th>អត្រាការប្រាក់ដែលយក</th>
                                    <th>កំណត់សំគាល់</th>
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

            let totalRiel = 0;
            let totalDollar = 0;
            let totalBaht = 0;

            let totalRielInRiel = 0;
            let totalDollarInRiel = 0;
            let totalBahtInRiel = 0;

            let totalInRiel = 0;

            let numberLoanRiel = 0;
            let numberLoanDollar = 0;
            let numberLoanBaht = 0;

            let totalNumberLoan = 0;

            let totalRateRiel = 0;
            let totalRateDollar = 0;
            let totalRateBaht = 0;


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
                        if (loanAccDoc.currencyId == "KHR") {
                            numberLoanRiel++;
                            totalRateRiel += loanAccDoc.interestRate;
                            totalRiel += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;


                        } else if (loanAccDoc.currencyId == "USD") {
                            numberLoanDollar++;
                            totalRateDollar += loanAccDoc.interestRate;
                            totalDollar += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;

                        } else if (loanAccDoc.currencyId == "THB") {
                            numberLoanBaht++;
                            totalRateBaht += loanAccDoc.interestRate;
                            totalBaht += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                        }

                    }


                }
            })


            totalRielInRiel = totalRiel;
            totalDollarInRiel = Meteor.call('exchangeNBC', "USD", "KHR", totalDollar, params.exchangeId);
            totalBahtInRiel = Meteor.call('exchangeNBC', "THB", "KHR", totalDollar, params.exchangeId);

            totalInRiel = totalRielInRiel + totalDollarInRiel + totalBahtInRiel;

            let averageRateRiel = 0;
            let averageRateDollar = 0;
            let averageRateBaht = 0;

            if (numberLoanRiel > 0) {
                averageRateRiel = totalRateRiel / numberLoanRiel;
            }

            if (numberLoanDollar > 0) {
                averageRateDollar = totalRateDollar / numberLoanDollar;
            }

            if (numberLoanBaht > 0) {
                averageRateBaht = totalRateBaht / numberLoanBaht;
            }

            totalNumberLoan = numberLoanRiel + numberLoanDollar + numberLoanBaht;
            content += `
                        <tr>
                            <td>១. ប្រាក់រៀល</td>
                            <td class="numberAlign">${numberLoanRiel}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalRiel)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalRielInRiel)}</td>
                            <td class="numberAlign">${microfis_formatNumber(averageRateRiel)}%</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>២. ប្រាក់ដុល្លារអាមេរិក</td>
                            <td class="numberAlign">${numberLoanDollar}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDollar)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDollarInRiel)}</td>
                            <td class="numberAlign">${microfis_formatNumber(averageRateDollar)}%</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>៣. ប្រាក់បាតថៃ</td>
                            <td class="numberAlign">${numberLoanBaht}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalBaht)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalBahtInRiel)}</td>
                            <td class="numberAlign">${microfis_formatNumber(averageRateBaht)}%</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td><b>សរុប</b></td>
                            <td class="numberAlign">${totalNumberLoan}</td>
                            <td></td>
                            <td class="numberAlign">${microfis_formatNumber(totalInRiel)}</td>
                            <td></td>
                            <td></td>
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

