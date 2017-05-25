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
import {Repayment} from '../../../common/collections/repayment';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

export const loanRepaymentReport = new ValidatedMethod({
    name: 'microfis.loanRepaymentReport',
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

            let fDate = moment(date[0], "DD/MM/YYYY").startOf("days").toDate();
            let tDate = moment(date[1], "DD/MM/YYYY").endOf("days").toDate();

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
            header.repayFrequency = "All";
            header.status = "All";

            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                        <th>Voucher Code</th>
                                    <th>LA Code</th>
                                    <th>Client Name</th>
                                    <th>Product Name</th>
                                    <th>CRC</th>
                                    <th>Type</th>
                                    <th>Dis Date</th>
                                    <th>Mat Date</th>
                                    <th>Loan Amount</th>
                                    <th>Pro Int</th>
                                    <th>Pro Operation Fee</th>
                                        <th>Col Date</th>
                                        <th>Status</th>	
                                    <th>Col Prin</th>
                                    <th>Col Int</th>
                                    <th>Col Operation Fee</th>
                                    <th>Total Col</th>
                                    <th>Col Pen</th>
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

            // let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
            /*selector.disbursementDate = {$lte: dateParam};
             selector['$or'] = [{status: "Active"},
             {closeDate: {$exists: true, $gt: dateParam}},
             {writeOffDate: {$exists: true, $gt: dateParam}},
             {restructureDate: {$exists: true, $gt: dateParam}}
             ];*/

            let selectorRepayment = {};
            if (params.status !== "All") {
                selectorRepayment.$and = [{type: params.status}, {type: {$ne: "Fee"}}];
                header.status = params.status;
            } else {
                selectorRepayment.type = {$ne: "Fee"};
            }


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


            let totalColPrinKHR = 0;
            let totalColIntKHR = 0;
            let totalColFeeOnPaymentKHR = 0;
            let totalColPrinIntKHR = 0;
            let totalColPenKHR = 0;

            let totalColPrinUSD = 0;
            let totalColIntUSD = 0;
            let totalColFeeOnPaymentUSD = 0;
            let totalColPrinIntUSD = 0;
            let totalColPenUSD = 0;

            let totalColPrinTHB = 0;
            let totalColIntTHB = 0;
            let totalColFeeOnPaymentTHB = 0;
            let totalColPrinIntTHB = 0;
            let totalColPenTHB = 0;


            let totalColPrinBase = 0;
            let totalColIntBase = 0;
            let totalColFeeOnPaymentBase = 0;
            let totalColPrinIntBase = 0;
            let totalColPenBase = 0;


            selectorRepayment.repaidDate = {
                $lte: tDate,
                $gte: fDate
            }

            if (loanDoc.length > 0) {
                loanDoc.forEach(function (loanAccDoc) {

                    selectorRepayment.loanAccId = loanAccDoc._id;

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


                    let repaymentDoc = Repayment.find(selectorRepayment).fetch();

                    if (repaymentDoc != undefined && repaymentDoc.length > 0) {
                        repaymentDoc.forEach(function (repaymentObj) {

                            let repaymentScheduleDoc = RepaymentSchedule.aggregate([

                                {
                                    $project: {"repaymentDoc.detail": 1}
                                },
                                {$unwind: '$repaymentDoc.detail'},
                                {$match: {"repaymentDoc.detail.repaymentId": repaymentObj._id}}
                            ])


                            if (repaymentScheduleDoc.length > 0) {

                                let checkClassify = true;
                                if (params.classifyId && params.classifyId.includes("All") == false) {
                                    checkClassify = false;
                                }

                                let principalPaid = 0;
                                let interestPaid = 0;
                                let feeOnPaymentPaid = 0;
                                let penaltyPaid = 0;

                                repaymentScheduleDoc.forEach(function (obj) {

                                    let finProductStatus = function (obj) {
                                        return repaymentScheduleDoc[0].repaymentDoc.detail.numOfDayLate >= obj.from && repaymentScheduleDoc[0].repaymentDoc.detail.numOfDayLate <= obj.to;
                                    }
                                    let proStatus = productStatusList.find(finProductStatus);
                                    //check product status (Classify)
                                    if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {


                                        principalPaid += obj.repaymentDoc.detail.principalPaid;
                                        interestPaid += obj.repaymentDoc.detail.interestPaid;
                                        feeOnPaymentPaid += obj.repaymentDoc.detail.feeOnPaymentPaid;
                                        penaltyPaid += obj.repaymentDoc.detail.penaltyPaid;


                                        if (loanAccDoc.currencyId == "KHR") {

                                            totalColPrinKHR += obj.repaymentDoc.detail.principalPaid;
                                            totalColIntKHR += obj.repaymentDoc.detail.interestPaid;
                                            totalColFeeOnPaymentKHR += obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPrinIntKHR += obj.repaymentDoc.detail.principalPaid + obj.repaymentDoc.detail.interestPaid + obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPenKHR += obj.repaymentDoc.detail.penaltyPaid;


                                        } else if (loanAccDoc.currencyId == "USD") {
                                            totalColPrinUSD += obj.repaymentDoc.detail.principalPaid;
                                            totalColIntUSD += obj.repaymentDoc.detail.interestPaid;
                                            totalColFeeOnPaymentUSD += obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPrinIntUSD += obj.repaymentDoc.detail.principalPaid + obj.repaymentDoc.detail.interestPaid + obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPenUSD += obj.repaymentDoc.detail.penaltyPaid;
                                        } else if (loanAccDoc.currencyId == "THB") {
                                            totalColPrinTHB = obj.repaymentDoc.detail.principalPaid;
                                            totalColIntTHB = obj.repaymentDoc.detail.interestPaid;
                                            totalColFeeOnPaymentTHB = obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPrinIntTHB = obj.repaymentDoc.detail.principalPaid + obj.repaymentDoc.detail.interestPaid + obj.repaymentDoc.detail.feeOnPaymentPaid;
                                            totalColPenTHB = obj.repaymentDoc.detail.penaltyPaid;
                                        }
                                    }
                                })

                                content += `<tr>
                                <td>${i}</td>
                                <td>${repaymentObj.voucherId.substr(8)}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectFeeOnPayment)}</td>
                              
                                <td> ${microfis_formatDate(repaymentObj.repaidDate)}</td>
                                <td> ${repaymentObj.type}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principalPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(interestPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(feeOnPaymentPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principalPaid + interestPaid + feeOnPaymentPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(penaltyPaid)}</td>
                            </tr>`;

                                i++;

                            } else {
                                if (loanAccDoc.currencyId == "KHR") {

                                    totalColPrinKHR += 0;
                                    totalColIntKHR += 0;
                                    totalColFeeOnPaymentKHR += 0;
                                    totalColPrinIntKHR += repaymentObj.amountPaid;
                                    totalColPenKHR += 0;


                                } else if (loanAccDoc.currencyId == "USD") {
                                    totalColPrinUSD += 0;
                                    totalColIntUSD += 0;
                                    totalColFeeOnPaymentUSD += 0;
                                    totalColPrinIntUSD += repaymentObj.amountPaid;
                                    totalColPenUSD += 0;
                                } else if (loanAccDoc.currencyId == "THB") {
                                    totalColPrinTHB = 0;
                                    totalColIntTHB = 0;
                                    totalColFeeOnPaymentTHB = 0;
                                    totalColPrinIntTHB = repaymentObj.amountPaid;
                                    totalColPenTHB = 0;
                                }


                                content += `<tr>
                                <td>${i}</td>
                                <td>${repaymentObj.voucherId}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectFeeOnPayment)}</td>
                              
                                <td> ${microfis_formatDate(repaymentObj.repaidDate)}</td>
                                <td> ${repaymentObj.type}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(0)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(0)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(0)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(repaymentObj.amountPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(0)}</td>
                            </tr>`;

                                i++;
                            }
                        })
                    }

                })
            }

            totalColPrinBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalColPrinKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalColPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalColPrinTHB,
                    params.exchangeId);
            totalColIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalColIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalColIntUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalColIntTHB,
                    params.exchangeId);

            totalColFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalColFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalColFeeOnPaymentUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalColFeeOnPaymentTHB,
                    params.exchangeId);

            totalColPrinIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalColPrinIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalColPrinIntUSD,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalColPrinIntTHB,
                    params.exchangeId
                );
            totalColPenBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalColPenKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalColPenUSD,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalColPenTHB,
                    params.exchangeId
                );
            content += `<tr>
                            <td colspan="14" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenKHR)}</td>
                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenBase)}</td>

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

