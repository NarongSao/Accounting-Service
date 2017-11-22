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
import {Exchange} from '../../../../core/common/collections/exchange.js';
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

export const loanOutstandingReport = new ValidatedMethod({
    name: 'microfis.loanOutstandingReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        params: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({params}) {
        if (!this.isSimulation) {
            // Meteor._sleepForMs(200);

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


            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(params.date).format("DD/MM/YYYY");
            header.productId = "All";
            header.locationId = "All";

            header.fundId = "All";
            header.classifyId = "All";
            header.paymentMethod = "All";

            header.repayFrequency = "All";

            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>LA Code</th>
                                    <th>Client Name</th>
                                    <th>Product Name</th>
                                    <th>CRC</th>
                                    <th>Type</th>
                                    <th>Dis Date</th>
                                    <th>Mat Date</th>
                                    <th>Loan Amount</th>
                                    <th>Pro Int</th>
                                    <th>Classify</th>
                                    <th>CO</th>
                                    <th>Vill</th>	
                                    <th>Due Prin</th>
                                    <th>Due Int</th>
                                    <th>Due Fee</th>
                                    <th>Total Due</th>
                                    <th>Loan Out Prin</th>
                                    <th>Loan Out Int</th>
                                    <th>Loan Out Fee</th>
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


            //Param
            let selector = {};


            if (params.coType == "Only") {
                selector.changeCOId = "";
            } else if (params.coType == "Transfer") {
                selector.changeCOId = {$ne: ""};
            }


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

            if (params.paymentMethod && params.paymentMethod.includes("All") == false) {
                selector.paymentMethod = {$in: params.paymentMethod};
                header.paymentMethod = params.paymentMethod.toString();

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
            if (params.accountType && params.accountType.includes("All") == false) {
                selector.accountType =  params.accountType;

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

            if (params.repayFrequency > 0) {
                selector.repaidFrequency = parseInt(params.repayFrequency);
                header.repayFrequency = params.repayFrequency;
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

            let i = 1;

            let checkDate = moment(params.date, "DD/MM/YYYY").toDate();

            //Loop Active Loan in check date


            let totalDuePrinKHR = 0;
            let totalDueIntKHR = 0;
            let totalDueFeeOnPaymentKHR = 0;
            let totalLoanOutPrinKHR = 0;
            let totalLoanOutIntKHR = 0;
            let totalLoanOutFeeOnPaymentKHR = 0;


            let totalDuePrinUSD = 0;
            let totalDueIntUSD = 0;
            let totalDueFeeOnPaymentUSD = 0;
            let totalLoanOutPrinUSD = 0;
            let totalLoanOutIntUSD = 0;
            let totalLoanOutFeeOnPaymentUSD = 0;


            let totalDuePrinTHB = 0;
            let totalDueIntTHB = 0;
            let totalDueFeeOnPaymentTHB = 0;
            let totalLoanOutPrinTHB = 0;
            let totalLoanOutIntTHB = 0;
            let totalLoanOutFeeOnPaymentTHB = 0;


            let totalDuePrinBase = 0;
            let totalDueIntBase = 0;
            let totalDueFeeOnPaymentBase = 0;
            let totalLoanOutPrinBase = 0;
            let totalLoanOutIntBase = 0;
            let totalLoanOutFeeOnPaymentBase = 0;

            if (loanDoc.length > 0) {
                loanDoc.forEach(function (loanAccDoc) {

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
                            totalDuePrinKHR += result.totalScheduleDue.principalDue;
                            totalDueIntKHR += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentKHR += result.totalScheduleDue.feeOnPaymentDue;
                            totalLoanOutPrinKHR += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntKHR += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                            totalLoanOutFeeOnPaymentKHR += result.totalScheduleNext.feeOnPaymentDue + result.totalScheduleDue.feeOnPaymentDue;
                        } else if (loanAccDoc.currencyId == "USD") {
                            totalDuePrinUSD += result.totalScheduleDue.principalDue;
                            totalDueIntUSD += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentUSD += result.totalScheduleDue.feeOnPaymentDue;
                            totalLoanOutPrinUSD += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntUSD += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                            totalLoanOutFeeOnPaymentUSD += result.totalScheduleNext.feeOnPaymentDue + result.totalScheduleDue.feeOnPaymentDue;
                        } else if (loanAccDoc.currencyId == "THB") {
                            totalDuePrinTHB += result.totalScheduleDue.principalDue;
                            totalDueIntTHB += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentTHB += result.totalScheduleDue.feeOnPaymentDue;
                            totalLoanOutPrinTHB += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntTHB += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                            totalLoanOutFeeOnPaymentTHB += result.totalScheduleNext.feeOnPaymentDue + result.totalScheduleDue.feeOnPaymentDue;
                        }


                        content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>
                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td> ${proStatus.name}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td> ${loanAccDoc.locationDoc.khName}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.principalDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.interestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.feeOnPaymentDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.totalPrincipalInterestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleNext.feeOnPaymentDue + result.totalScheduleDue.feeOnPaymentDue)}</td>
                            </tr>`;

                        i++;
                    }
                })
            }

            totalDuePrinBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDuePrinKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDuePrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDuePrinTHB,
                    params.exchangeId);
            totalDueIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDueIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDueIntUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDueIntTHB,
                    params.exchangeId);

            totalDueFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDueFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDueFeeOnPaymentUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDueFeeOnPaymentTHB,
                    params.exchangeId);

            totalLoanOutPrinBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanOutPrinKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalLoanOutPrinUSD,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalLoanOutPrinTHB,
                    params.exchangeId
                );
            totalLoanOutIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanOutIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalLoanOutIntUSD,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalLoanOutIntTHB,
                    params.exchangeId
                );

            totalLoanOutFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanOutFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalLoanOutFeeOnPaymentUSD,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalLoanOutFeeOnPaymentTHB,
                    params.exchangeId
                );
            content += `<tr>
                            <td colspan="13" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR + totalDueIntKHR + totalDueFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutFeeOnPaymentKHR)}</td>
                        </tr>
                        <tr>
                            <td colspan="13" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD + totalDueIntUSD + totalDueFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutFeeOnPaymentUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="13" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB + totalDueIntTHB + totalDueFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutFeeOnPaymentTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="13" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase + totalDueIntBase + totalDueFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOutFeeOnPaymentBase)}</td>

                        </tr>
                        
                        
                        </tbody>
                      </table>`;

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

