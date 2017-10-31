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

export const loanClosingReport = new ValidatedMethod({
    name: 'microfis.loanClosingReport',
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
            /****** Content *****/
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


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>LA Code</th>
                                    <th>Client Name</th>
                                    <th>Staff Name</th>
                                    <th>Product Name</th>
                                    <th>CRC</th>
                                    <th>Type</th>
                                    <th>Disb Date</th>
                                    <th>Mat Date</th>
                                    <th>Address</th>
                                    
                                    <th>Loan Amount</th>
                                    <th>Project Interest</th>                                   
                                    <th>Fin Date</th>                                   
                                    <th>Sum Loss Interest</th>                                   
                                    <th>Sum Loss Operation Fee</th>                                   
                                    <th>Waived</th>                                   
                                    <th>Sum Col Prin Last</th>                                   
                                    <th>Sum Col Int Last</th>                                   
                                    <th>Sum Col Operation Fee Last</th>                                   
                                    <th>Sum Col Penalty Closing Last</th>                                   
                                    <th>Total Sum Col Last</th>
                                    <th>Sum Col Pen Last</th>
                                   
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


            if (params.accountType && params.accountType.includes("All") == false) {
                selector.accountType =  params.accountType;

            }

            if (params.repayFrequency > 0) {
                selector.repaidFrequency = parseInt(params.repayFrequency);
                header.repayFrequency = params.repayFrequency;
            }

            selector.disbursementDate = {
                // $gte: fDate,
                $lte: tDate
            };
            selector.status = "Close";
            selector.closeDate = {$exists: true, $lte: tDate, $gte: fDate};


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

            let checkDate = tDate;

            //Loop Active Loan in check date


            let totalDuePrinKHR = 0;
            let totalDueIntKHR = 0;
            let totalDueFeeOnPaymentKHR = 0;
            let totalSumLossIntKHR = 0;
            let totalSumLossFeeOnPaymentKHR = 0;
            let totalPenaltyKHR = 0;
            let totalWaivedForClosingKHR = 0;
            let totalPenaltyClosingKHR = 0;


            let totalDuePrinUSD = 0;
            let totalDueIntUSD = 0;
            let totalDueFeeOnPaymentUSD = 0;
            let totalSumLossIntUSD = 0;
            let totalSumLossFeeOnPaymentUSD = 0;
            let totalPenaltyUSD = 0;
            let totalWaivedForClosingUSD = 0;
            let totalPenaltyClosingUSD = 0;

            let totalDuePrinTHB = 0;
            let totalDueIntTHB = 0;
            let totalDueFeeOnPaymentTHB = 0;
            let totalSumLossIntTHB = 0;
            let totalSumLossFeeOnPaymentTHB = 0;
            let totalPenaltyTHB = 0;
            let totalWaivedForClosingTHB = 0;
            let totalPenaltyClosingTHB = 0;

            let totalDuePrinBase = 0;
            let totalDueIntBase = 0;
            let totalDueFeeOnPaymentBase = 0;
            let totalSumLossIntBase = 0;
            let totalSumLossFeeOnPaymentBase = 0;
            let totalPenaltyBase = 0;
            let totalWaivedForClosingBase = 0;
            let totalPenaltyClosingBase = 0;
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

                    if (result.totalScheduleDue.dueDate.from) {
                        if (moment(result.totalScheduleDue.dueDate.from).toDate().getTime() >= moment(params.date, "DD/MM/YYYY").startOf("day").toDate().getTime()) {
                            result.totalScheduleDue.dueDate.from = null;
                        }
                    }


                    let finProductStatus = function (obj) {
                        return (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) >= obj.from && (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) <= obj.to;
                    }
                    let proStatus = productStatusList.find(finProductStatus);

                    if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {
                        if (loanAccDoc.currencyId == "KHR") {
                            totalDuePrinKHR += result.lastRepayment.detailDoc.totalSchedulePaid.principalPaid;
                            totalDueIntKHR += result.lastRepayment.detailDoc.totalSchedulePaid.interestPaid;
                            totalDueFeeOnPaymentKHR += result.lastRepayment.detailDoc.totalSchedulePaid.feeOnPaymentPaid;
                            totalSumLossIntKHR += result.interestUnPaid;
                            totalSumLossFeeOnPaymentKHR += result.feeOnPaymentUnPaid;
                            totalPenaltyKHR += result.lastRepayment.detailDoc.totalSchedulePaid.penaltyPaid;
                            totalWaivedForClosingKHR += loanAccDoc.waivedForClosing;
                            totalPenaltyClosingKHR += result.lastRepayment.detailDoc.closing.interestReminderPenalty;

                        } else if (loanAccDoc.currencyId == "USD") {
                            totalDuePrinUSD += result.lastRepayment.detailDoc.totalSchedulePaid.principalPaid;
                            totalDueIntUSD += result.lastRepayment.detailDoc.totalSchedulePaid.interestPaid;
                            totalDueFeeOnPaymentUSD += result.lastRepayment.detailDoc.totalSchedulePaid.feeOnPaymentPaid;
                            totalSumLossIntUSD += result.interestUnPaid;
                            totalSumLossFeeOnPaymentUSD += result.feeOnPaymentUnPaid;
                            totalPenaltyUSD += result.lastRepayment.detailDoc.totalSchedulePaid.penaltyPaid;
                            totalWaivedForClosingUSD += loanAccDoc.waivedForClosing;
                            totalPenaltyClosingUSD += result.lastRepayment.detailDoc.closing.interestReminderPenalty;


                        } else if (loanAccDoc.currencyId == "THB") {
                            totalDuePrinTHB += result.lastRepayment.detailDoc.totalSchedulePaid.principalPaid;
                            totalDueIntTHB += result.lastRepayment.detailDoc.totalSchedulePaid.interestPaid;
                            totalDueFeeOnPaymentTHB += result.lastRepayment.detailDoc.totalSchedulePaid.feeOnPaymentPaid;
                            totalSumLossIntTHB += result.interestUnPaid;
                            totalSumLossFeeOnPaymentTHB += result.feeOnPaymentUnPaid;
                            totalPenaltyTHB += result.lastRepayment.detailDoc.totalSchedulePaid.penaltyPaid;
                            totalWaivedForClosingTHB += loanAccDoc.waivedForClosing;
                            totalPenaltyClosingTHB += result.lastRepayment.detailDoc.closing.interestReminderPenalty;


                        }


                        content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td> ${loanAccDoc.productDoc.name}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                
                                <td> ${LocationClass.getLocationByVillage(loanAccDoc.locationId)}</td>

                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                
                                <td> ${microfis_formatDate(result.lastRepayment.repaidDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.interestUnPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.feeOnPaymentUnPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.waivedForClosing)}</td>

                               
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.totalSchedulePaid.principalPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.totalSchedulePaid.interestPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.totalSchedulePaid.feeOnPaymentPaid)}</td>
                                
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.closing.interestReminderPenalty)}</td>
                                
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.totalSchedulePaid.totalPrincipalInterestPaid)}</td>
                                
                                <td class="numberAlign"> ${microfis_formatNumber(result.lastRepayment.detailDoc.totalSchedulePaid.penaltyPaid)}</td>
                                
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


            totalSumLossIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalSumLossIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalSumLossIntUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalSumLossIntTHB,
                    params.exchangeId);

            totalSumLossFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalSumLossFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalSumLossFeeOnPaymentUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalSumLossFeeOnPaymentTHB,
                    params.exchangeId);

            totalPenaltyBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalPenaltyKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPenaltyUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPenaltyTHB,
                    params.exchangeId);

            totalWaivedForClosingBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalWaivedForClosingKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalWaivedForClosingUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalWaivedForClosingTHB,
                    params.exchangeId);

            totalPenaltyClosingBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalPenaltyClosingKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPenaltyClosingUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPenaltyClosingTHB,
                    params.exchangeId);


            content += `<tr>
                            <td colspan="13" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalWaivedForClosingKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyClosingKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR + totalDueIntKHR + totalDueFeeOnPaymentKHR + totalPenaltyClosingKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyKHR)}</td>

                        </tr>
                        <tr>
                            <td colspan="13" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalWaivedForClosingUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyClosingUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD + totalDueIntUSD + totalDueFeeOnPaymentUSD + totalPenaltyClosingUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="13" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalWaivedForClosingTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyClosingTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB + totalDueIntTHB + totalDueFeeOnPaymentTHB + totalPenaltyClosingTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="13" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalSumLossFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalWaivedForClosingBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyClosingBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase + totalDueIntBase + totalDueFeeOnPaymentBase + totalPenaltyClosingBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPenaltyBase)}</td>

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

