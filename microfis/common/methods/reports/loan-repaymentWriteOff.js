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
import {Repayment} from '../../../common/collections/repayment';


import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

export const loanRepaymentWriteOffReport = new ValidatedMethod({
        name: 'microfis.loanRepaymentWriteOffReport',
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

                let date = params.date;

                let fDate = moment(date[0], "DD/MM/YYYY").startOf("days").toDate();
                let tDate = moment(date[1], "DD/MM/YYYY").endOf("days").toDate();

                /****** Header *****/


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
                header.repaidFrequency = "All";
                header.paymentMethod = "All";

                /****** Content *****/


                let baseCurrency = Setting.findOne().baseCurrency;

                let content = "";
                content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>Voucher</th>
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
                                 	
                                    <th>Principal</th>	
                                    <th>Interest</th>	
                                    <th>Operation Fee</th>	
                                    <th>Col WriteOff</th>	
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


                //Param
                let selector = {};
                let selectorRepay = {};

                if (params.coType == "Only") {
                    selector["loanDoc.changeCOId"] = "";
                } else if (params.coType == "Transfer") {
                    selector["loanDoc.changeCOId"] = {$ne: ""};
                }

                if (params.branchId && params.branchId.includes("All") == false) {
                    selector["loanDoc.branchId"] = {$in: params.branchId};
                    selectorRepay.branchId = {$in: params.branchId};
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
                    selector["loanDoc.creditOfficerId"] = {$in: params.creditOfficerId};
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
                    selector["loanDoc.paymentMethod"] = {$in: params.paymentMethod};
                    header.paymentMethod = params.paymentMethod.toString();

                }

                if (params.currencyId && params.currencyId.includes("All") == false) {
                    selector["loanDoc.currencyId"] = {$in: params.currencyId};
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
                    selector["loanDoc.productId"] = {$in: params.productId};
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
                    selector["loanDoc.locationId"] = {$in: params.locationId};
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
                    selector["loanDoc.fundId"] = {$in: params.fundId};
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

                if (params.repaidFrequency !== "All") {
                    selector["loanDoc.repaidFrequency"] = parseInt(params.repaidFrequency);
                    header.repaidFrequency = params.repaidFrequency;
                }


                let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
                selector["loanDoc.disbursementDate"] = {$lte: dateParam};


                // selector['feeDate'] = {$exists: true, $gte: fDate, $lte: tDate};

                selector["loanDoc.status"] = "Write Off";

                data.header = header;

                selectorRepay.type = "Write Off";
                selectorRepay.repaidDate = {$exists: true, $gte: fDate, $lte: tDate};

                //All Active Loan in check date


                let loanDoc = Repayment.aggregate([
                    {$match: selectorRepay},
                    {
                        $lookup: {
                            from: "microfis_loanAcc",
                            localField: "loanAccId",
                            foreignField: "_id",
                            as: "loanDoc"
                        }
                    },
                    {$unwind: {path: "$loanDoc", preserveNullAndEmptyArrays: true}},
                    {$match: selector},
                    {
                        $lookup: {
                            from: "microfis_client",
                            localField: "loanDoc.clientId",
                            foreignField: "_id",
                            as: "clientDoc"
                        }
                    },
                    {$unwind: {path: "$clientDoc", preserveNullAndEmptyArrays: true}},
                    {
                        $lookup: {
                            from: "microfis_fund",
                            localField: "loanDoc.fundId",
                            foreignField: "_id",
                            as: "fundDoc"
                        }
                    },
                    {$unwind: {path: "$fundDoc", preserveNullAndEmptyArrays: true}},
                    {
                        $lookup: {
                            from: "microfis_creditOfficer",
                            localField: "loanDoc.creditOfficerId",
                            foreignField: "_id",
                            as: "creditOfficerDoc"
                        }
                    },
                    {$unwind: {path: "$creditOfficerDoc", preserveNullAndEmptyArrays: true}},
                    {
                        $lookup: {
                            from: "microfis_location",
                            localField: "loanDoc.locationId",
                            foreignField: "_id",
                            as: "locationDoc"
                        }
                    },
                    {$unwind: {path: "$locationDoc", preserveNullAndEmptyArrays: true}},

                    {
                        $lookup: {
                            from: "microfis_product",
                            localField: "loanDoc.productId",
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

                //Loop Active Loan in check date


                let totalWriteOffKHR = 0;
                let totalWriteOffUSD = 0;
                let totalWriteOffTHB = 0;

                let totalPrincipalWriteOffKHR = 0;
                let totalPrincipalWriteOffUSD = 0;
                let totalPrincipalWriteOffTHB = 0;

                let totalInterestWriteOffKHR = 0;
                let totalInterestWriteOffUSD = 0;
                let totalInterestWriteOffTHB = 0;

                let totalFeeOnPaymentWriteOffKHR = 0;
                let totalFeeOnPaymentWriteOffUSD = 0;
                let totalFeeOnPaymentWriteOffTHB = 0;

                let totalWriteOffBase = 0;
                let totalPrincipalWriteOffBase = 0;
                let totalInterestWriteOffBase = 0;
                let totalFeeOnPaymentWriteOffBase = 0;
                if (loanDoc.length > 0) {
                    loanDoc.forEach(function (loanAccDoc) {

                            let principal = 0;
                            let interest = 0;
                            let feeOnPayment = 0;

                            if (loanAccDoc.loanDoc.paymentWriteOff.length > 1) {
                                loanAccDoc.loanDoc.paymentWriteOff.forEach(function (obj) {

                                        if (moment(loanAccDoc.repaidDate).startOf("day").toDate().getTime() == moment(obj.rePaidDate).startOf("day").toDate().getTime()) {
                                            if (loanAccDoc.currencyId == "KHR") {
                                                totalPrincipalWriteOffKHR += obj.amount;
                                                totalInterestWriteOffKHR += obj.interest;
                                                totalFeeOnPaymentWriteOffKHR += obj.feeOnPayment || 0;
                                                principal += obj.amount;
                                                interest += obj.interest;
                                                feeOnPayment += obj.feeOnPayment || 0;

                                            } else if (loanAccDoc.currencyId == "USD") {
                                                totalPrincipalWriteOffUSD += obj.amount;
                                                totalInterestWriteOffUSD += obj.interest;
                                                totalFeeOnPaymentWriteOffUSD += obj.feeOnPayment || 0;

                                                principal += obj.amount;
                                                interest += obj.interest;
                                                feeOnPayment += obj.feeOnPayment || 0;


                                            } else if (loanAccDoc.currencyId == "THB") {
                                                totalPrincipalWriteOffTHB += obj.amount;
                                                totalInterestWriteOffTHB += obj.interest;
                                                totalFeeOnPaymentWriteOffTHB += obj.feeOnPayment || 0;

                                                principal += obj.amount;
                                                interest += obj.interest;
                                                feeOnPayment += obj.feeOnPayment || 0;


                                            }
                                        }
                                    }
                                )


                            }

                            if (loanAccDoc.currencyId == "KHR") {
                                totalWriteOffKHR += loanAccDoc.amountPaid;

                            } else if (loanAccDoc.currencyId == "USD") {
                                totalWriteOffUSD += loanAccDoc.amountPaid;

                            } else if (loanAccDoc.currencyId == "THB") {
                                totalWriteOffTHB += loanAccDoc.amountPaid;

                            }

                            content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc.voucherId.substr(8, loanAccDoc.voucherId.length - 1)}</td>
                                <td>${loanAccDoc.loanDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.loanDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.loanDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.loanDoc.maturityDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanDoc.projectFeeOnPayment)}</td>
                         
                                <td> ${microfis_formatDate(loanAccDoc.repaidDate)}</td>
                                <td> WriteOff</td>
                        
                                <td class="numberAlign"> ${microfis_formatNumber(principal)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(interest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(feeOnPayment)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.amountPaid)}</td>
                               
                            </tr>`;

                            i++;
                        }
                    )
                }

                totalWriteOffBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalWriteOffKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalWriteOffUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalWriteOffTHB,
                        params.exchangeId
                    );

                totalPrincipalWriteOffBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalPrincipalWriteOffKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalPrincipalWriteOffUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalPrincipalWriteOffTHB,
                        params.exchangeId
                    );

                totalInterestWriteOffBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalInterestWriteOffKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalInterestWriteOffUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalInterestWriteOffTHB,
                        params.exchangeId
                    );


                totalFeeOnPaymentWriteOffBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalFeeOnPaymentWriteOffKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalFeeOnPaymentWriteOffUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalFeeOnPaymentWriteOffTHB,
                        params.exchangeId
                    );


                content += `<tr>
                            <td colspan="14" align="right">Subtotal-KHR</td>
    
                            <td>${microfis_formatNumber(totalPrincipalWriteOffKHR)}</td>
                            <td>${microfis_formatNumber(totalInterestWriteOffKHR)}</td>
                            <td>${microfis_formatNumber(totalFeeOnPaymentWriteOffKHR)}</td>
                            <td>${microfis_formatNumber(totalWriteOffKHR)}</td>
                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-USD</td>
                      
                            <td>${microfis_formatNumber(totalPrincipalWriteOffUSD)}</td>
                            <td>${microfis_formatNumber(totalInterestWriteOffUSD)}</td>
                            <td>${microfis_formatNumber(totalFeeOnPaymentWriteOffUSD)}</td>

                            <td>${microfis_formatNumber(totalWriteOffUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Subtotal-THB</td>
                         
                            <td>${microfis_formatNumber(totalPrincipalWriteOffTHB)}</td>
                            <td>${microfis_formatNumber(totalInterestWriteOffTHB)}</td>
                            <td>${microfis_formatNumber(totalFeeOnPaymentWriteOffTHB)}</td>

                            <td>${microfis_formatNumber(totalWriteOffTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="14" align="right">Total-${baseCurrency}</td>
                      
                            <td>${microfis_formatNumber(totalPrincipalWriteOffBase)}</td>
                            <td>${microfis_formatNumber(totalInterestWriteOffBase)}</td>
                            <td>${microfis_formatNumber(totalFeeOnPaymentWriteOffBase)}</td>
                            <td>${microfis_formatNumber(totalWriteOffBase)}</td>

                        </tr>
                                              
                        </tbody>
                      </table>`;

                data.content = content;
                return data
            }
        }
    })
;

let microfis_formatDate = function (val) {
    return moment(val).format("DD/MM/YYYY");
}

let microfis_formatNumber = function (val) {
    return numeral(val).format("(0,00.00)");
}

