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
import  {checkRepaymentRealTime} from '../check-repayment.js';

export const writeOffEndingReport = new ValidatedMethod({
    name: 'microfis.writeOffEndingReport',
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
            let date = moment(params.date).startOf("days").toDate();

            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(date).format("DD/MM/YYYY");
            header.productId = "All";
            header.locationId = "All";

            header.fundId = "All";

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
                                 
                                    <th>Write-Off Date</th>  
                                    <th>Num Of Days</th>  
                                    <th>CO</th>  
                                                                     
                                    <th>Write-Off Prin</th>
                                    <th>Write-Off Int</th>
                                    <th>Write-Off Operation-Fee</th>
                                    
                                    <th>Coll-Prin</th>
                                    <th>Coll-Int</th>
                                    <th>Coll-Operation-Fee</th>   
                                    
                                    <th>Prin Bal</th>
                                    <th>Int Bal</th>
                                    <th>Operation-Fee Bal</th>
                                    <th>Total Coll</th>
                                    <th>Tel</th>
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


            if (params.repayFrequency > 0) {
                selector.repaidFrequency = parseInt(params.repayFrequency);
                header.repayFrequency = params.repayFrequency;
            }

            data.header = header;

            selector["writeOff.writeOffDate"] = {
                $lte: date
            };

            selector.status = "Write Off";

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

            let checkDate = date;

            //Loop Active Loan in check date


            let totalDuePrinKHR = 0;
            let totalDueIntKHR = 0;
            let totalDueFeeOnPaymentKHR = 0;

            let totalDueCollPrinKHR = 0;
            let totalDueCollIntKHR = 0;
            let totalDueCollFeeOnPaymentKHR = 0;


            let totalDuePrinUSD = 0;
            let totalDueIntUSD = 0;
            let totalDueFeeOnPaymentUSD = 0;

            let totalDueCollPrinUSD = 0;
            let totalDueCollIntUSD = 0;
            let totalDueCollFeeOnPaymentUSD = 0;


            let totalDuePrinTHB = 0;
            let totalDueIntTHB = 0;
            let totalDueFeeOnPaymentTHB = 0;

            let totalDueCollPrinTHB = 0;
            let totalDueCollIntTHB = 0;
            let totalDueCollFeeOnPaymentTHB = 0;


            let totalDuePrinBase = 0;
            let totalDueIntBase = 0;
            let totalDueFeeOnPaymentBase = 0;

            let totalDueCollPrinBase = 0;
            let totalDueCollIntBase = 0;
            let totalDueCollFeeOnPaymentBase = 0;

            if (loanDoc && loanDoc.length > 0) {
                loanDoc.forEach(function (loanAccDoc) {


                    let collPrin = 0;
                    let collInt = 0;
                    let collFeeOnPayment = 0;


                    if (loanAccDoc.currencyId == "KHR") {
                        totalDuePrinKHR += loanAccDoc.writeOff.amount;
                        totalDueIntKHR += loanAccDoc.writeOff.interest;
                        totalDueFeeOnPaymentKHR += loanAccDoc.writeOff.feeOnPayment;

                        if (loanAccDoc.paymentWriteOff && loanAccDoc.paymentWriteOff.length > 1) {
                            loanAccDoc.paymentWriteOff.forEach(function (obj) {
                                totalDueCollPrinKHR += obj.amount;
                                totalDueCollIntKHR += obj.interest;
                                totalDueCollFeeOnPaymentKHR += obj.feeOnPayment;

                                collPrin += obj.amount;
                                collInt += obj.interest;
                                collFeeOnPayment += obj.feeOnPayment;


                            })

                        }


                    } else if (loanAccDoc.currencyId == "USD") {
                        totalDuePrinUSD += loanAccDoc.writeOff.amount;
                        totalDueIntUSD += loanAccDoc.writeOff.interest;
                        totalDueFeeOnPaymentUSD += loanAccDoc.writeOff.feeOnPayment;

                        if (loanAccDoc.paymentWriteOff && loanAccDoc.paymentWriteOff.length > 1) {
                            loanAccDoc.paymentWriteOff.forEach(function (obj) {
                                totalDueCollPrinUSD += obj.amount;
                                totalDueCollIntUSD += obj.interest;
                                totalDueCollFeeOnPaymentUSD += obj.feeOnPayment;

                                collPrin += obj.amount;
                                collInt += obj.interest;
                                collFeeOnPayment += obj.feeOnPayment;
                            })

                        }

                    } else if (loanAccDoc.currencyId == "THB") {
                        totalDuePrinTHB += loanAccDoc.writeOff.amount;
                        totalDueIntTHB += loanAccDoc.writeOff.interest;
                        totalDueFeeOnPaymentTHB += loanAccDoc.writeOff.feeOnPayment;

                        if (loanAccDoc.paymentWriteOff && loanAccDoc.paymentWriteOff.length > 1) {
                            loanAccDoc.paymentWriteOff.forEach(function (obj) {
                                totalDueCollPrinTHB += obj.amount;
                                totalDueCollIntTHB += obj.interest;
                                totalDueCollFeeOnPaymentTHB += obj.feeOnPayment;


                                collPrin += obj.amount;
                                collInt += obj.interest;
                                collFeeOnPayment += obj.feeOnPayment;
                            })

                        }
                    }

                    let numDaysLate = moment(date).diff(moment(loanAccDoc.writeOff.lateDate, "DD/MM/YYYY").toDate(), "days");


                    content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                               
                                <td> ${microfis_formatDate(loanAccDoc.writeOff.writeOffDate)}</td>
                                <td> ${numDaysLate}</td>

                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>

                               
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.amount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.interest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.feeOnPayment)}</td>
                                
                                <td class="numberAlign"> ${microfis_formatNumber(collPrin)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(collInt)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(collFeeOnPayment)}</td>
                                
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.amount-collPrin)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.interest-collInt)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.writeOff.feeOnPayment-collFeeOnPayment)}</td>
                                
                                
                                <td class="numberAlign"> ${microfis_formatNumber(collFeeOnPayment + collInt + collPrin)}</td>
                                
                                <td> ${loanAccDoc.clientDoc.telephone || ''}</td>
                              </tr>`;
                    i++;
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


            totalDueCollPrinBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDueCollPrinKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDueCollPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDueCollPrinTHB,
                    params.exchangeId);
            totalDueCollIntBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDueCollIntKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDueCollIntUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDueCollIntTHB,
                    params.exchangeId);


            totalDueCollFeeOnPaymentBase = Meteor.call('microfis_exchange',
                    "KHR",
                    baseCurrency,
                    totalDueCollFeeOnPaymentKHR,
                    params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalDueCollFeeOnPaymentUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalDueCollFeeOnPaymentTHB,
                    params.exchangeId);


            content += `<tr>
                            <td colspan="9" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentKHR)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollFeeOnPaymentKHR)}</td>
                            
                             <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR-totalDueCollPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntKHR-totalDueCollIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentKHR-totalDueCollFeeOnPaymentKHR)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinKHR + totalDueCollIntKHR + totalDueCollFeeOnPaymentKHR)}</td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="9" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentUSD)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollFeeOnPaymentUSD)}</td> 
                                           
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD-totalDueCollPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntUSD-totalDueCollIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentUSD-totalDueCollFeeOnPaymentUSD)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinUSD + totalDueCollIntUSD + totalDueCollFeeOnPaymentUSD)}</td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="9" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentTHB)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollFeeOnPaymentTHB)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB-totalDueCollPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntTHB-totalDueCollIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentTHB-totalDueCollFeeOnPaymentTHB)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinTHB + totalDueCollIntTHB + totalDueCollFeeOnPaymentTHB)}</td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="9" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentBase)}</td>
                             
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollFeeOnPaymentBase)}</td>   
                                 
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase-totalDueCollPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntBase-totalDueCollIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentBase-totalDueCollFeeOnPaymentBase)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalDueCollPrinBase + totalDueCollIntBase + totalDueCollFeeOnPaymentBase)}</td>
                            <td></td>

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
    if (val) {
        return numeral(val).format("(0,00.00)");
    }
    return 0;
}



