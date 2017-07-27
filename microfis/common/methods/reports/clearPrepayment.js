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

export const clearPrepaymentReport = new ValidatedMethod({
        name: 'microfis.clearPrepaymentReport',
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
                                        <th>Clear Date</th>	
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
                    selector["loanDoc.changeCOId"] = "";
                } else if (params.coType == "Transfer") {
                    selector["loanDoc.changeCOId"] = {$ne: ""};
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
                    selector["loanDoc.repaidFrequency"] = parseInt(params.repayFrequency);
                    header.repayFrequency = params.repayFrequency;
                }

                let selectorRepayment = {};


                if (params.branchId && params.branchId.includes("All") == false) {
                    selectorRepayment.branchId = {$in: params.branchId};
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

                selectorRepayment['repaymentDoc.detail.endId'] = {$exists: true};
                selectorRepayment['repaymentDoc.detail.repaidDate'] = {$gte: fDate, $lte: tDate};


                data.header = header;

                //All Active Loan in check date


                let clearPrepay = RepaymentSchedule.aggregate([
                    {$unwind: "$repaymentDoc.detail"},
                    {
                        $match: selectorRepayment
                    },
                    {
                        $lookup: {
                            from: "microfis_loanAcc",
                            localField: "loanAccId",
                            foreignField: "_id",
                            as: "loanDoc"
                        }
                    }
                    ,
                    {$unwind: {path: "$loanDoc", preserveNullAndEmptyArrays: true}},
                    {
                        $match: selector
                    },
                    {
                        $lookup: {
                            from: "microfis_client",
                            localField: "loanDoc.clientId",
                            foreignField: "_id",
                            as: "clientDoc"
                        }
                    }
                    ,
                    {$unwind: {path: "$clientDoc", preserveNullAndEmptyArrays: true}},
                    {
                        $lookup: {
                            from: "microfis_product",
                            localField: "loanDoc.productId",
                            foreignField: "_id",
                            as: "productDoc"
                        }
                    }
                    ,
                    {$unwind: {path: "$productDoc", preserveNullAndEmptyArrays: true}},

                    {
                        $lookup: {
                            from: "microfis_clearPrepay",
                            localField: "repaymentDoc.detail.endId",
                            foreignField: "_id",
                            as: "endOfProcessDoc"
                        }
                    }
                    ,
                    {$unwind: {path: "$endOfProcessDoc", preserveNullAndEmptyArrays: true}}
                    ,
                    {
                        $lookup: {
                            from: "microfis_repayment",
                            localField: "repaymentDoc.detail.repaymentId",
                            foreignField: "_id",
                            as: "repaymentCollectionDoc"
                        }
                    },
                    {
                        $match: {
                            "repaymentCollectionDoc.type": "Prepay"
                        }
                    }
                    ,
                    {
                        $unwind: {
                            path: "$repaymentCollectionDoc", preserveNullAndEmptyArrays: true
                        }
                    }
                    ,
                    {
                        $sort: {
                            'repaymentCollectionDoc.voucherId': 1,
                            'endOfProcessDoc.closeDate': 1


                        }
                    }

                ])


                let i = 1;


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


                if (clearPrepay.length > 0) {
                    clearPrepay.forEach(function (clearPrepayDoc) {

                        let productStatusList;
                        if (clearPrepayDoc.loanDoc.paymentMethod == "D") {
                            if (clearPrepayDoc.loanDoc.term <= 365) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }

                        } else if (clearPrepayDoc.loanDoc.paymentMethod == "W") {
                            if (clearPrepayDoc.loanDoc.term <= 52) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }
                        } else if (clearPrepayDoc.loanDoc.paymentMethod == "M") {
                            if (clearPrepayDoc.loanDoc.term <= 12) {
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


                        let principalPaid = 0;
                        let interestPaid = 0;
                        let feeOnPaymentPaid = 0;
                        let penaltyPaid = 0;


                        let finProductStatus = function (obj) {
                            return (clearPrepayDoc.repaymentDoc.detail.numOfDayLate < 0 ? 0 : clearPrepayDoc.repaymentDoc.detail.numOfDayLate ) >= obj.from && (clearPrepayDoc.repaymentDoc.detail.numOfDayLate < 0 ? 0 : clearPrepayDoc.repaymentDoc.detail.numOfDayLate ) <= obj.to;
                        }
                        let proStatus = productStatusList.find(finProductStatus);
                        //check product status (Classify)
                        if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {


                            principalPaid += clearPrepayDoc.repaymentDoc.detail.principalPaid;
                            interestPaid += clearPrepayDoc.repaymentDoc.detail.interestPaid;
                            feeOnPaymentPaid += clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                            penaltyPaid += clearPrepayDoc.repaymentDoc.detail.penaltyPaid;


                            if (clearPrepayDoc.loanDoc.currencyId == "KHR") {

                                totalColPrinKHR += clearPrepayDoc.repaymentDoc.detail.principalPaid;
                                totalColIntKHR += clearPrepayDoc.repaymentDoc.detail.interestPaid;
                                totalColFeeOnPaymentKHR += clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPrinIntKHR += clearPrepayDoc.repaymentDoc.detail.principalPaid + clearPrepayDoc.repaymentDoc.detail.interestPaid + clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPenKHR += clearPrepayDoc.repaymentDoc.detail.penaltyPaid;


                            } else if (clearPrepayDoc.loanDoc.currencyId == "USD") {
                                totalColPrinUSD += clearPrepayDoc.repaymentDoc.detail.principalPaid;
                                totalColIntUSD += clearPrepayDoc.repaymentDoc.detail.interestPaid;
                                totalColFeeOnPaymentUSD += clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPrinIntUSD += clearPrepayDoc.repaymentDoc.detail.principalPaid + clearPrepayDoc.repaymentDoc.detail.interestPaid + clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPenUSD += clearPrepayDoc.repaymentDoc.detail.penaltyPaid;
                            } else if (clearPrepayDoc.loanDoc.currencyId == "THB") {
                                totalColPrinTHB = clearPrepayDoc.repaymentDoc.detail.principalPaid;
                                totalColIntTHB = clearPrepayDoc.repaymentDoc.detail.interestPaid;
                                totalColFeeOnPaymentTHB = clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPrinIntTHB = clearPrepayDoc.repaymentDoc.detail.principalPaid + clearPrepayDoc.repaymentDoc.detail.interestPaid + clearPrepayDoc.repaymentDoc.detail.feeOnPaymentPaid;
                                totalColPenTHB = clearPrepayDoc.repaymentDoc.detail.penaltyPaid;
                            }


                            content += `<tr>
                                <td>${i}</td>
                                <td>${clearPrepayDoc.repaymentCollectionDoc.voucherId.substr(8, clearPrepayDoc.repaymentCollectionDoc.voucherId.length - 1)}</td>
                                <td>${clearPrepayDoc.loanDoc._id}</td>
                                <td> ${clearPrepayDoc.clientDoc.khSurname}  ${clearPrepayDoc.clientDoc.khGivenName} </td>
                                <td> ${clearPrepayDoc.productDoc.name}</td>

                                <td> ${clearPrepayDoc.loanDoc.currencyId}</td>
                                <td> ${clearPrepayDoc.loanDoc.accountType}</td>
                                <td> ${microfis_formatDate(clearPrepayDoc.loanDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(clearPrepayDoc.loanDoc.maturityDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(clearPrepayDoc.loanDoc.loanAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(clearPrepayDoc.loanDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(clearPrepayDoc.loanDoc.projectFeeOnPayment)}</td>
                              
                                <td> ${microfis_formatDate(clearPrepayDoc.repaymentCollectionDoc.repaidDate)}</td>
                                <td> ${microfis_formatDate(clearPrepayDoc.repaymentDoc.detail.repaidDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principalPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(interestPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(feeOnPaymentPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principalPaid + interestPaid + feeOnPaymentPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(penaltyPaid)}</td>
                            </tr>`;

                            i++;


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
    }
);

let microfis_formatDate = function (val) {
    return moment(val).format("DD/MM/YYYY");
}

let microfis_formatNumber = function (val) {
    return numeral(val).format("(0,00.00)");
}
