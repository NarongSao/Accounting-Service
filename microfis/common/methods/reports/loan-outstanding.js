import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/common/collections/company.js';
import {Branch} from '../../../../core/common/collections/branch.js';
import {Setting} from '../../../../core/common/collections/setting.js';
import {LoanAcc} from '../../../common/collections/loan-acc.js';
import {ProductStatus} from '../../../common/collections/productStatus.js';
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
            data.header = "";

            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-hover">
                            <thead class=" sub-header rpt rpt-3x">
                                <tr> 
                                    <th>No</th>
                                    <th>LA Code</th>
                                    <th>Clent Name</th>
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
                                    <th>Total Due</th>
                                    <th>Loan Out Prin</th>
                                    <th>Loan Out Int</th>
                                </tr>
                            </thead>
                            <tbody class="rpt rpt-3x sub-body">`;


            //Param
            let selector = {};
            if (params.branchId && params.branchId.includes("All") == false) {
                selector.branchId = {$in: params.branchId};
            }
            if (params.creditOfficerId && params.creditOfficerId.includes("All") == false) {
                selector.creditOfficerId = {$in: params.creditOfficerId};
            }

            if (params.paymentMethod && params.paymentMethod.includes("All") == false) {
                selector.paymentMethod = {$in: params.paymentMethod};
            }

            if (params.currencyId && params.currencyId.includes("All") == false) {
                selector.currencyId = {$in: params.currencyId};
            }
            if (params.productId && params.productId.includes("All") == false) {
                selector.productId = {$in: params.productId};
            }

            if (params.locationId && params.locationId.includes("All") == false) {
                selector.locationId = {$in: params.locationId};
            }

            if (params.fundId && params.fundId.includes("All") == false) {
                selector.fundId = {$in: params.fundId};
            }

            if (params.classifyId && params.classifyId.includes("All") == false) {
                selector.classifyId = {$in: params.classifyId};
            }

            let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
            selector.disbursementDate = {$lte: dateParam};
            selector.status = "Active";

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


            let productStatusList = ProductStatus.find().fetch();

            let totalDuePrinKHR = 0;
            let totalDueIntKHR = 0;
            let totalLoanOutPrinKHR = 0;
            let totalLoanOutIntKHR = 0;


            let totalDuePrinUSD = 0;
            let totalDueIntUSD = 0;
            let totalLoanOutPrinUSD = 0;
            let totalLoanOutIntUSD = 0;


            let totalDuePrinTHB = 0;
            let totalDueIntTHB = 0;
            let totalLoanOutPrinTHB = 0;
            let totalLoanOutIntTHB = 0;


            let totalDuePrinBase = 0;
            let totalDueIntBase = 0;
            let totalLoanOutPrinBase = 0;
            let totalLoanOutIntBase = 0;


            loanDoc.forEach(function (loanAccDoc) {

                let result = checkRepayment.run({
                    loanAccId: loanAccDoc._id,
                    checkDate: checkDate,
                    opts: loanAccDoc
                });


                let finProductStatus = function (obj) {
                    return result.totalScheduleDue.numOfDayLate >= obj.from && result.totalScheduleDue.numOfDayLate <= obj.to;
                }
                let proStatus = productStatusList.find(finProductStatus);

                if (loanAccDoc.currencyId == "KHR") {
                    totalDuePrinKHR += result.totalScheduleDue.principalDue;
                    totalDueIntKHR += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinKHR += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                    totalLoanOutIntKHR += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                } else if (loanAccDoc.currencyId == "USD") {
                    totalDuePrinUSD += result.totalScheduleDue.principalDue;
                    totalDueIntUSD += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinUSD += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                    totalLoanOutIntUSD += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                } else if (loanAccDoc.currencyId == "THB") {
                    totalDuePrinTHB += result.totalScheduleDue.principalDue;
                    totalDueIntTHB += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinTHB += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                    totalLoanOutIntTHB += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;
                }


                content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td> ${proStatus.name}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td> ${loanAccDoc.locationDoc.name}</td>
                                <td> ${microfis_formatNumber(result.totalScheduleDue.principalDue)}</td>
                                <td> ${microfis_formatNumber(result.totalScheduleDue.interestDue)}</td>
                                <td> ${microfis_formatNumber(result.totalScheduleDue.totalPrincipalInterestDue)}</td>
                                <td> ${microfis_formatNumber(result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue)}</td>
                                <td> ${microfis_formatNumber(result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue)}</td>
                            </tr>`;

                i++;
            })

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
            content += `<tr>
                            <td colspan="12" align="right">Subtotal-KHR</td>
                            <td>${microfis_formatNumber(totalDuePrinKHR)}</td>
                            <td>${microfis_formatNumber(totalDueIntKHR)}</td>
                            <td>${microfis_formatNumber(totalDuePrinKHR + totalDueIntKHR)}</td>
                            <td>${microfis_formatNumber(totalLoanOutPrinKHR)}</td>
                            <td>${microfis_formatNumber(totalLoanOutIntKHR)}</td>
                        </tr>
                        <tr>
                            <td colspan="12" align="right">Subtotal-USD</td>
                            <td>${microfis_formatNumber(totalDuePrinUSD)}</td>
                            <td>${microfis_formatNumber(totalDueIntUSD)}</td>
                            <td>${microfis_formatNumber(totalDuePrinUSD + totalDueIntUSD)}</td>
                            <td>${microfis_formatNumber(totalLoanOutPrinUSD)}</td>
                            <td>${microfis_formatNumber(totalLoanOutIntUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="12" align="right">Subtotal-THB</td>
                            <td>${microfis_formatNumber(totalDuePrinTHB)}</td>
                            <td>${microfis_formatNumber(totalDueIntTHB)}</td>
                            <td>${microfis_formatNumber(totalDuePrinTHB + totalDueIntTHB)}</td>
                            <td>${microfis_formatNumber(totalLoanOutPrinTHB)}</td>
                            <td>${microfis_formatNumber(totalLoanOutIntTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="12" align="right">Total-${baseCurrency}</td>
                            <td>${microfis_formatNumber(totalDuePrinBase)}</td>
                            <td>${microfis_formatNumber(totalDueIntBase)}</td>
                            <td>${microfis_formatNumber(totalDuePrinBase + totalDueIntBase)}</td>
                            <td>${microfis_formatNumber(totalLoanOutPrinBase)}</td>
                            <td>${microfis_formatNumber(totalLoanOutIntBase)}</td>

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

