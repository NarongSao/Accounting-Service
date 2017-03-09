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

export const productActivityReport = new ValidatedMethod({
    name: 'microfis.productActivityReport',
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
                                    <th>Coll Pen</th>
                                    <th>Total Coll</th>
                                    <th>Loan Out</th>	
                                    <th>All Client</th>
                                    <th>Arrears Print</th>
                                    <th>Arrears Int</th>
                                    <th>PAR</th>
                                    <th>PAR (NBC)</th>
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


            if (params.repaidFrequency !== "All") {
                selector.repaidFrequency = params.repaidFrequency;
                header.repaidFrequency = params.repaidFrequency;
            }


            /*selector.disbursementDate = {$lte: dateParam};
             selector['$or'] = [{status: "Active"},
             {closeDate: {$exists: true, $gt: dateParam}},
             {writeOffDate: {$exists: true, $gt: dateParam}},
             {restructureDate: {$exists: true, $gt: dateParam}}
             ];*/


            data.header = header;

            //All Active Loan in check date


            let loanDoc = LoanAcc.aggregate([
                {$match: selector},

                {
                    $lookup: {
                        from: "microfis_creditOfficer",
                        localField: "creditOfficerId",
                        foreignField: "_id",
                        as: "creditOfficerDoc"
                    }
                },
                {$unwind: {path: "$creditOfficerDoc", preserveNullAndEmptyArrays: true}}
            ]);




            //Method From Mongo
            /*var loan = db.microfis_loanAcc.aggregate([
                {
                    $lookup: {
                        from: "microfis_repayment",
                        localField: "_id",
                        foreignField: "loanAccId",
                        as: "repaymentDoc"
                    }
                },
                {
                    $lookup: {
                        from: "microfis_creditOfficer",
                        localField: "creditOfficerId",
                        foreignField: "_id",
                        as: "creditOfficerDoc"
                    }
                },
                { $unwind: { path: "$creditOfficerDoc", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            creditOfficerDoc: '$creditOfficerDoc'
                        },
                        newClient: {
                            $sum: { $cond: [{ $gt: ['$cycle', 1] }, 0, 1] }
                        },
                        oldClient: {
                            $sum: { $cond: [{ $gt: ['$cycle', 1] }, 1, 0] }
                        },
                        loanDisbursment: {
                            $sum: '$loanAmount'
                        },
                        totalFee: {
                            $sum: '$feeAmount'
                        },
                        loanAccIdList: { $push: "$_id" }
                    }

                },
                {
                    $lookup: {
                        from: "microfis_repayment",
                        localField: "loanAccId",
                        foreignField: "_id",
                        as: "repaymentDoc"
                    }
                }

            ]);
            data;
            var data;
            var data2;
            loan.forEach(function(obj) {
                data = db.microfis_repayment.aggregate([
                    { $match: { loanAccId: { $in: obj.loanAccIdList } } },
                    { $unwind: { path: "$detailDoc.schedulePaid", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: {},
                            collPrin: {
                                $sum: { $cond: [{ $lte: ['$detailDoc.schedulePaid.repaidDate', moment().toDate()] }, '$detailDoc.schedulePaid.principalPaid', 0] }
                            },
                            collInt: {
                                $sum: { $cond: [{ $lte: ['$detailDoc.schedulePaid.repaidDate', moment().toDate()] }, '$detailDoc.schedulePaid.interestPaid', 0] }
                            },
                            collPenalty: {
                                $sum: { $cond: [{ $lte: ['$detailDoc.schedulePaid.repaidDate', moment().toDate()] }, '$detailDoc.schedulePaid.penaltyPaid', 0] }
                            },
                            collTotal: {
                                $sum: { $cond: [{ $lte: ['$detailDoc.schedulePaid.repaidDate', moment().toDate()] }, '$detailDoc.schedulePaid.totalAmountPaid', 0] }
                            }

                        }
                    }
                ])


            })
            data;*/



















            let i = 1;

            let checkDate = params[1];

            //Loop Active Loan in check date


            let totalLoanDisbursment = 0;
            let totalNewClient = 0;
            let totalOldClient = 0;
            let totalFee = 0;
            let totalCollPrin = 0;
            let totalCollInt = 0;
            let totalCollPen = 0;
            let totalColl = 0;
            let totalLoanOut = 0;
            let totalAllClient = 0;
            let totalArrearsPrin = 0;
            let totalArrearsInt = 0;


            loanDoc.forEach(function (loanAccDoc) {

                let result = checkRepayment.run({
                    loanAccId: loanAccDoc._id,
                    checkDate: checkDate,
                    opts: loanAccDoc
                });


                if (loanAccDoc.currencyId == "KHR") {

                } else if (loanAccDoc.currencyId == "USD") {

                } else if (loanAccDoc.currencyId == "THB") {

                }


                content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc.creditOfficerDoc._id}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>`;

                i++;

            })


            content += `<tr>
                            <td colspan="3" align="right">Total</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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

