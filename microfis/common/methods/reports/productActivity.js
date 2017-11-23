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

export const productActivityReport = new ValidatedMethod({
    name: 'microfis.productActivityReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        params: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({params}) {
        if (!this.isSimulation) {
            this.unblock();

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
            header.repaidFrequency = "All";
            header.paymentMethod = "All";


            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>Staff Id</th>
                                    <th>Kh Staff Name</th>
                                    <th>Loan Disbursment</th>
                                    <th>N.Client</th>
                                    <th>O.Client</th>
                                    <th>Fee</th>
                                    <th>Coll Prin</th>
                                    <th>Coll Int</th>
                                    <th>Coll FeeOnPayment</th>
                                    <th>Coll Pen</th>
                                    <th>Total Coll</th>
                                    <th>Loan Out</th>	
                                    <th>All Client</th>
                                    <th>Arrears Print</th>
                                    <th>Arrears Int</th>
                                    <th>Arrears FeeOnPayment</th>
                                    <th>PAR</th>
                                    <th>PAR (NBC)</th>
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
                if (params.currencyId.length == 1) {
                    baseCurrency = params.currencyId[0];
                }
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


            if (params.repaidFrequency !== "All") {
                selector.repaidFrequency = parseInt(params.repaidFrequency);
                header.repaidFrequency = params.repaidFrequency;
            }


            selector.disbursementDate = {$lte: tDate};
            selector['$or'] = [{status: "Active"},
                {closeDate: {$exists: true, $gt: tDate}},
                {writeOffDate: {$exists: true, $gt: tDate}},
                {restructureDate: {$exists: true, $gt: tDate}},
                {waivedDate: {$exists: true, $gt: tDate}}
            ];


            data.header = header;

            let exchange = Exchange.findOne({_id: params.exchangeId});


            //All Active Loan in check date

            //Method From Mongo
            let coefficientLoanDisburment = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$loanAmount',
                baseCurrency
            });
            let coefficientTotalFee = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$feeAmount',
                baseCurrency
            });

            let loan = LoanAcc.aggregate([
                {$match: selector},
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
                    $project: {

                        creditOfficerDoc: "$creditOfficerDoc",
                        cycle: "$cycle",
                        _id: "$_id",
                        disbursementDate: "$disbursementDate",
                        loanAmount: {
                            $cond: {
                                if: {$eq: ['$currencyId', 'USD']},
                                then: coefficientLoanDisburment.USD,
                                else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientLoanDisburment.KHR, coefficientLoanDisburment.THB]}
                            }
                        },
                        feeAmount: {
                            $cond: {
                                if: {$eq: ['$currencyId', 'USD']},
                                then: coefficientTotalFee.USD,
                                else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientTotalFee.KHR, coefficientTotalFee.THB]}
                            }
                        }

                    }
                }
                ,
                {
                    $group: {
                        _id: {
                            creditOfficerDoc: '$creditOfficerDoc'
                        },
                        newClient: {
                            $sum: {$cond: [{$and: [{$eq: ['$cycle', 1]}, {$gte: ['$disbursementDate', fDate]}]}, 1, 0]}
                        },
                        oldClient: {
                            $sum: {$cond: [{$and: [{$gt: ['$cycle', 1]}, {$gte: ['$disbursementDate', fDate]}]}, 1, 0]}
                        },
                        loanDisbursment: {
                            $sum: {$cond: [{$gte: ['$disbursementDate', fDate]}, '$loanAmount', 0]}
                        },
                        totalFee: {
                            $sum: {$cond: [{$gte: ['$disbursementDate', fDate]}, '$feeAmount', 0]}
                        },
                        loanAccIdList: {$push: "$_id"}
                    }

                }

            ]);

            let i = 1;
            let checkDate = date[1];

            let totalLoanDisbursment = 0;
            let totalNewClient = 0;
            let totalOldClient = 0;
            let totalFee = 0;
            let totalCollPrin = 0;
            let totalCollInt = 0;
            let totalCollFeeOnPayment = 0;
            let totalCollPen = 0;
            let totalColl = 0;
            let totalLoanOut = 0;
            let totalAllClient = 0;
            let totalArrearsPrin = 0;
            let totalArrearsInt = 0;
            let totalArrearsFeeOnPayment = 0;


            let coefficientPrincipalPaid = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$detailDoc.schedulePaid.principalPaid',
                baseCurrency
            });
            let coefficientInterestPaid = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$detailDoc.schedulePaid.interestPaid',
                baseCurrency
            });

            let coefficientFeeOnPaymentPaid = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$detailDoc.schedulePaid.feeOnPaymentPaid',
                baseCurrency
            });
            let coefficientPenaltyPaid = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$detailDoc.schedulePaid.penaltyPaid',
                baseCurrency
            });
            let coefficientAmountPaid = exchangeCoefficient({
                exchange,
                fieldToCalculate: '$detailDoc.schedulePaid.totalAmountPaid',
                baseCurrency
            });

            loan.forEach(function (obj) {

                let dataCollection = Repayment.aggregate([
                    {$match: {loanAccId: {$in: obj.loanAccIdList}}},
                    {$unwind: {path: "$detailDoc.schedulePaid", preserveNullAndEmptyArrays: true}},
                    {
                        $project: {
                            collPrin: {
                                $cond: {
                                    if: {$eq: ['$currencyId', 'USD']},
                                    then: coefficientPrincipalPaid.USD,
                                    else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientPrincipalPaid.KHR, coefficientPrincipalPaid.THB]}
                                }
                            },
                            collInt: {
                                $cond: {
                                    if: {$eq: ['$currencyId', 'USD']},
                                    then: coefficientInterestPaid.USD,
                                    else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientInterestPaid.KHR, coefficientInterestPaid.THB]}
                                }
                            },
                            collFeeOnPayment: {
                                $cond: {
                                    if: {$eq: ['$currencyId', 'USD']},
                                    then: coefficientFeeOnPaymentPaid.USD,
                                    else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientFeeOnPaymentPaid.KHR, coefficientFeeOnPaymentPaid.THB]}
                                }
                            },
                            collPenalty: {
                                $cond: {
                                    if: {$eq: ['$currencyId', 'USD']},
                                    then: coefficientPenaltyPaid.USD,
                                    else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientPenaltyPaid.KHR, coefficientPenaltyPaid.THB]}
                                }
                            },
                            collTotal: {
                                $cond: {
                                    if: {$eq: ['$currencyId', 'USD']},
                                    then: coefficientAmountPaid.USD,
                                    else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficientAmountPaid.KHR, coefficientAmountPaid.THB]}
                                }
                            },
                            repaidDate: '$detailDoc.schedulePaid.repaidDate'

                        }
                    },
                    {
                        $group: {
                            _id: {},
                            collPrin: {
                                $sum: {$cond: [{$and: [{$lte: ['$repaidDate', tDate]}, {$gte: ['$repaidDate', fDate]}]}, '$collPrin', 0]}
                            },
                            collInt: {
                                $sum: {$cond: [{$and: [{$lte: ['$repaidDate', tDate]}, {$gte: ['$repaidDate', fDate]}]}, '$collInt', 0]}
                            },
                            collFeeOnPayment: {
                                $sum: {$cond: [{$and: [{$lte: ['$repaidDate', tDate]}, {$gte: ['$repaidDate', fDate]}]}, '$collFeeOnPayment', 0]}
                            },
                            collPenalty: {
                                $sum: {$cond: [{$and: [{$lte: ['$repaidDate', tDate]}, {$gte: ['$repaidDate', fDate]}]}, '$collPenalty', 0]}
                            },
                            collTotal: {
                                $sum: {$cond: [{$and: [{$lte: ['$repaidDate', tDate]}, {$gte: ['$repaidDate', fDate]}]}, '$collTotal', 0]}
                            }

                        }
                    }
                ])


                let dataArrears = LoanAcc.aggregate([
                    {$match: {_id: {$in: obj.loanAccIdList}}},
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

                    /*{
                     $lookup: {
                     from: "microfis_fee",
                     localField: "productDoc.feeId",
                     foreignField: "_id",
                     as: "feeDoc"
                     }
                     },
                     {$unwind: {path: "$feeDoc", preserveNullAndEmptyArrays: true}},
                     */
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

                //Loop Active Loan in check date


                let subTotalLoanOut = 0;
                let subTotalArrearsPrin = 0;
                let subTotalArrearsInt = 0;
                let subTotalArrearsFeeOnPayment = 0;

                let subTotalArrearsPrinNBC = 0;

                let par = 0;
                let parNBC = 0;


                dataArrears.forEach(function (loanAccDoc) {

                    let result = checkRepayment.run({
                        loanAccId: loanAccDoc._id,
                        checkDate: checkDate,
                        opts: loanAccDoc
                    });

                    subTotalLoanOut += Meteor.call('microfis_exchange', loanAccDoc.currencyId, baseCurrency, result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue, params.exchangeId);
                    subTotalArrearsPrin += Meteor.call('microfis_exchange', loanAccDoc.currencyId, baseCurrency, result.totalScheduleDue.principalDue, params.exchangeId);
                    subTotalArrearsInt += Meteor.call('microfis_exchange', loanAccDoc.currencyId, baseCurrency, result.totalScheduleDue.interestDue, params.exchangeId);
                    subTotalArrearsFeeOnPayment += Meteor.call('microfis_exchange', loanAccDoc.currencyId, baseCurrency, result.totalScheduleDue.feeOnPaymentDue, params.exchangeId);

                    if (result.totalScheduleDue.numOfDayLate > 30) {
                        subTotalArrearsPrinNBC += Meteor.call('microfis_exchange', loanAccDoc.currencyId, baseCurrency, result.totalScheduleDue.principalDue, params.exchangeId);
                    }

                })

                par = subTotalArrearsPrin / subTotalLoanOut;
                parNBC = subTotalArrearsPrinNBC / subTotalLoanOut;

                let numberOfClient = obj.loanAccIdList.length;

                content += `<tr>
                                <td>${i}</td>
                                <td>${obj._id.creditOfficerDoc._id}</td>
                                <td> ${obj._id.creditOfficerDoc.khName}</td>
                                <td class="numberAlign">${microfis_formatNumber(obj.loanDisbursment)}</td>
                                <td>${obj.newClient}</td>
                                <td>${obj.oldClient}</td>
                                <td class="numberAlign">${microfis_formatNumber(obj.totalFee)}</td>
                                <td class="numberAlign">${microfis_formatNumber(dataCollection[0] && dataCollection[0].collPrin || 0)}</td>
                                <td class="numberAlign">${microfis_formatNumber(dataCollection[0] && dataCollection[0].collInt || 0)}</td>
                                <td class="numberAlign">${microfis_formatNumber(dataCollection[0] && dataCollection[0].collFeeOnPayment || 0)}</td>
                                <td class="numberAlign">${microfis_formatNumber(dataCollection[0] && dataCollection[0].collPenalty || 0)}</td>
                                <td class="numberAlign">${microfis_formatNumber(dataCollection[0] && dataCollection[0].collTotal || 0)}</td>
                                <td class="numberAlign">${microfis_formatNumber(subTotalLoanOut)}</td>
                                <td>${numberOfClient}</td>
                                <td class="numberAlign">${microfis_formatNumber(subTotalArrearsPrin)}</td>
                                <td class="numberAlign">${microfis_formatNumber(subTotalArrearsInt)}</td>
                                <td class="numberAlign">${microfis_formatNumber(subTotalArrearsFeeOnPayment)}</td>
                                <td class="numberAlign">${microfis_formatNumber(par * 100)}%</td>
                                <td class="numberAlign">${microfis_formatNumber(parNBC * 100)}%</td>
                            </tr>`;

                i++;

                totalLoanDisbursment += obj.loanDisbursment;
                totalNewClient += obj.newClient;
                totalOldClient += obj.oldClient;
                totalFee += obj.totalFee;

                totalCollPrin += dataCollection[0] && dataCollection[0].collPrin || 0;
                totalCollInt += dataCollection[0] && dataCollection[0].collInt || 0;
                totalCollFeeOnPayment += dataCollection[0] && dataCollection[0].collFeeOnPayment || 0;
                totalCollPen += dataCollection[0] && dataCollection[0].collPenalty || 0;
                totalColl += dataCollection[0] && dataCollection[0].collTotal || 0;

                totalLoanOut += subTotalLoanOut;
                totalAllClient += numberOfClient;
                totalArrearsPrin += subTotalArrearsPrin;
                totalArrearsInt += subTotalArrearsInt;
                totalArrearsFeeOnPayment += subTotalArrearsFeeOnPayment;

            })


            content += `<tr>
                            <td colspan="3" align="right">Total</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanDisbursment)}</td>
                            <td>${totalNewClient}</td>
                            <td>${totalOldClient}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalFee)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalCollPrin)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalCollInt)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalCollFeeOnPayment)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalCollPen)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColl)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalLoanOut)}</td>
                            <td>${totalAllClient}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalArrearsPrin)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalArrearsInt)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalArrearsFeeOnPayment)}</td>
                            <td></td>
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
    return moment(val).format("DD/MM/YYYY");
}

let microfis_formatNumber = function (val) {
    return numeral(val).format("(0,00.00)");
}

let exchangeCoefficient = function ({exchange, fieldToCalculate, baseCurrency}) {
    let coefficient = {
        KHR: {},
        THB: {},
        USD: {}
    };
    if (baseCurrency == 'USD') {
        coefficient.KHR.$divide = [fieldToCalculate, exchange.rates.KHR];
        coefficient.THB.$divide = [fieldToCalculate, exchange.rates.THB];
        coefficient.USD.$multiply = [fieldToCalculate, 1];
    } else if (baseCurrency == 'THB') {
        coefficient.KHR.$divide = [fieldToCalculate, exchange.rates.KHR];
        coefficient.USD.$divide = [fieldToCalculate, exchange.rates.USD];
        coefficient.THB.$multiply = [fieldToCalculate, 1];
    } else {
        coefficient.THB.$multiply = [fieldToCalculate, exchange.rates.THB];
        coefficient.USD.$multiply = [fieldToCalculate, exchange.rates.USD];
        coefficient.KHR.$multiply = [fieldToCalculate, 1];
    }
    return coefficient;
};


