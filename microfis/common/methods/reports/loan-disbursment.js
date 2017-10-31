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

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

import LocationClass from "../../../imports/libs/getLocation";

export const loanDisbursmentReport = new ValidatedMethod({
    name: 'microfis.loanDisbursmentReport',
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


            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(fDate).format("DD/MM/YYYY") + " - " + moment(tDate).format("DD/MM/YYYY");
            header.productId = "All";
            header.locationId = "All";

            header.fundId = "All";
            header.classifyId = "All";
            header.paymentMethod = "All";
            header.cycle = "All";
            header.repayFrequency = "All";


            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>Voucher Code</th>
                                    <th>LA Code</th>
                                    <th>KH Client Name</th>
                                    <th>KH Staff Name</th>
                                    <th>Product Name</th>
                                    <th>CRC</th>
                                    <th>Acc Type</th>
                                    <th>Dis Date</th>
                                    <th>Mat Date</th>
                                    <th>Installment</th>
                                    <th>Rate</th>                                   
                                    <th>Cycle</th>
                                    <th>Address</th>
                                    <th>Loan Amount</th>
                                    <th>Fee</th>
                                    <th>Pro Int</th>
                                    <th>Operation Fee</th>
                                    <th>Total Due</th>
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
            if (params.cycle > 0) {
                selector.cycle = params.cycle;
                header.cycle = params.cycle;

            }

            if (params.repayFrequency > 0) {
                selector.repaidFrequency = parseInt(params.repayFrequency);
                header.repayFrequency = params.repayFrequency;
            }


            data.header = header;

            selector.disbursementDate = {
                $gte: fDate,
                $lte: tDate
            };

            selector['$or'] = [{status: "Active"},
                {closeDate: {$exists: true, $gte: tDate}},
                {writeOffDate: {$exists: true, $gte: tDate}},
                {restructureDate: {$exists: true, $gte: tDate}},
                {waivedDate: {$exists: true, $gte: tDate}}
            ];

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
                {$unwind: {path: "$penaltyClosingDoc", preserveNullAndEmptyArrays: true}},
                {$sort: {voucherId: 1}}
            ]);

            let i = 1;

            //Loop Active Loan in check date


            let totalLoanAmountKHR = 0;
            let totalFeeKHR = 0;
            let totalProIntKHR = 0;
            let totalProFeeOnPaymentKHR = 0;


            let totalLoanAmountUSD = 0;
            let totalFeeUSD = 0;
            let totalProIntUSD = 0;
            let totalProFeeOnPaymentUSD = 0;


            let totalLoanAmountTHB = 0;
            let totalFeeTHB = 0;
            let totalProIntTHB = 0;
            let totalProFeeOnPaymentTHB = 0;


            let totalLoanAmountBase = 0;
            let totalFeeBase = 0;
            let totalProIntBase = 0;
            let totalProFeeOnPaymentBase = 0;


            let checkDate = tDate;

            loanDoc.forEach(function (loanAccDoc) {

                if (loanAccDoc.currencyId == "KHR") {

                    totalLoanAmountKHR += loanAccDoc.loanAmount;
                    totalFeeKHR += loanAccDoc.feeAmount;
                    totalProIntKHR += loanAccDoc.projectInterest;
                    totalProFeeOnPaymentKHR += loanAccDoc.projectFeeOnPayment;

                } else if (loanAccDoc.currencyId == "USD") {
                    totalLoanAmountUSD += loanAccDoc.loanAmount;
                    totalFeeUSD += loanAccDoc.feeAmount;
                    totalProIntUSD += loanAccDoc.projectInterest;
                    totalProFeeOnPaymentUSD += loanAccDoc.projectFeeOnPayment;
                } else if (loanAccDoc.currencyId == "THB") {
                    totalLoanAmountTHB += loanAccDoc.loanAmount;
                    totalFeeTHB += loanAccDoc.feeAmount;
                    totalProIntTHB += loanAccDoc.projectInterest;
                    totalProFeeOnPaymentTHB += loanAccDoc.projectFeeOnPayment;
                }


                content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc.voucherId.substr(8, loanAccDoc.voucherId.length - 1)}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                
                                <td> ${loanAccDoc.productDoc.name}</td>
                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td> ${loanAccDoc.term}</td>
                                <td> ${loanAccDoc.interestRate}</td>
                                <td> ${loanAccDoc.cycle}</td>
                                
                                <td> ${LocationClass.getLocationByVillage(loanAccDoc.locationId)}</td>
               
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.feeAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectFeeOnPayment)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount + loanAccDoc.feeAmount + loanAccDoc.projectInterest + loanAccDoc.projectFeeOnPayment)}</td>
                              </tr>`;

                i++;

            })

            totalLoanAmountBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanAmountKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalLoanAmountUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalLoanAmountTHB,
                    params.exchangeId);
            totalFeeBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalFeeKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalFeeUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalFeeTHB,
                    params.exchangeId);

            totalProIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalProIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalProIntUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalProIntTHB,
                    params.exchangeId);

            totalProFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalProFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalProFeeOnPaymentUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalProFeeOnPaymentTHB,
                    params.exchangeId);


            content += `

                        <tr>
                            <td colspan="14" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanAmountKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalFeeKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntKHR + totalProFeeOnPaymentKHR + totalFeeKHR + totalLoanAmountKHR)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-USD</td>
                      <td class="numberAlign">${microfis_formatNumber(totalLoanAmountUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalFeeUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntUSD + totalProFeeOnPaymentUSD + totalFeeUSD + totalLoanAmountUSD)}</td>
                        

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-THB</td>
                         <td class="numberAlign">${microfis_formatNumber(totalLoanAmountTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalFeeTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntTHB + totalProFeeOnPaymentTHB + totalFeeTHB + totalLoanAmountTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanAmountBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalFeeBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalProIntBase + totalProFeeOnPaymentBase + totalFeeBase + totalLoanAmountBase)}</td>
                  
                        </tr>
                        
                        
                        </tbody>
                      </table>`;

            data.content = content;
            return data
        }
    }
});

let microfis_formatDate = function (val) {
    if (val != null) {
        return moment(val).format("DD/MM/YYYY");
    } else {
        return "-";
    }
}

let microfis_formatNumber = function (val) {
    return numeral(val).format("(0,00.00)");
}

