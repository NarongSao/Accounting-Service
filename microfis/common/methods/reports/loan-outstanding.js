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
            content += `<table class="rpt-9 rpt rpt-content">
                            <thead class="rpt-content-body">
                                <tr> 
                                    <td>No</td>
                                    <td>LA Code</td>
                                    <td>Clent Name</td>
                                    <td>CRC</td>
                                    <td>Type</td>
                                    <td>Dis Date</td>
                                    <td>Mat Date</td>
                                    <td>Loan Amount</td>
                                    <td>Pro Int</td>
                                    <td>Classify</td>
                                    <td>CO</td>
                                    <td>Vill</td>
                                    <td>Due Prin</td>
                                    <td>Due Int</td>
                                    <td>Total Due</td>
                                    <td>Loan Out Prin</td>
                                    <td>Loan Out Int</td>
                                </tr>
                            </thead>
                            <tbody class="rpt-content-body">`;


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

            let dateParam = moment(params.date, "DD/MM/YYYY").add(1, 'days').toDate();
            selector.disbursementDate = {$lt: dateParam};
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

                console.log(result);

                let finProductStatus = function (obj) {
                    return result.totalScheduleDue.numOfDayLate >= obj.from && result.totalScheduleDue.numOfDayLate <= obj.to;
                }
                let proStatus = productStatusList.find(finProductStatus);

                if (loanAccDoc.currencyId == "KHR") {
                    totalDuePrinKHR += result.totalScheduleDue.principalDue;
                    totalDueIntKHR += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinKHR += result.totalScheduleNext.principalDue;
                    totalLoanOutIntKHR += result.totalScheduleNext.interestDue;
                } else if (loanAccDoc.currencyId == "USD") {
                    totalDuePrinUSD += result.totalScheduleDue.principalDue;
                    totalDueIntUSD += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinUSD += result.totalScheduleNext.principalDue;
                    totalLoanOutIntUSD += result.totalScheduleNext.interestDue;
                } else if (loanAccDoc.currencyId == "THB") {
                    totalDuePrinTHB += result.totalScheduleDue.principalDue;
                    totalDueIntTHB += result.totalScheduleDue.interestDue;
                    totalLoanOutPrinTHB += result.totalScheduleNext.principalDue;
                    totalLoanOutIntTHB += result.totalScheduleNext.interestDue;
                }


                content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${moment(loanAccDoc.disbursementDate).format("DD/MM/YYYY")}</td>
                                <td> ${moment(loanAccDoc.maturityDate).format("DD/MM/YYYY")}</td>
                                <td> ${numeral(loanAccDoc.loanAmount).format("(0,00.00)")}</td>
                                <td> ${numeral(loanAccDoc.projectInterest).format("(0,00.00)")}</td>
                                <td> ${proStatus.name}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td> ${loanAccDoc.locationDoc.name}</td>
                                <td> ${numeral(result.totalScheduleDue.principalDue).format("(0,00.00)")}</td>
                                <td> ${numeral(result.totalScheduleDue.interestDue).format("(0,00.00)")}</td>
                                <td> ${numeral(result.totalScheduleDue.totalPrincipalInterestDue).format("(0,00.00)")}</td>
                                <td> ${numeral(result.totalScheduleNext.principalDue).format("(0,00.00)")}</td>
                                <td> ${numeral(result.totalScheduleNext.interestDue).format("(0,00.00)")}</td>
                            </tr>`;

                i++;
            })

            totalDuePrinBase = Meteor.call('exchange',
                    "KHR",
                    baseCurrency,
                    totalDuePrinKHR,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "USD",
                    baseCurrency,
                    totalDuePrinUSD,
                    params.exchangeId)
                + Meteor.call('exchange',
                    "THB",
                    baseCurrency,
                    totalDuePrinTHB,
                    params.exchangeId);
            totalDueIntBase = Meteor.call('exchange',
                    "KHR",
                    baseCurrency,
                    totalDueIntKHR,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "USD",
                    baseCurrency,
                    totalDueIntUSD,
                    params.exchangeId)
                + Meteor.call('exchange',
                    "THB",
                    baseCurrency,
                    totalDueIntTHB,
                    params.exchangeId);

            totalLoanOutPrinBase = Meteor.call('exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanOutPrinKHR,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "USD",
                    baseCurrency,
                    totalLoanOutPrinUSD,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "THB",
                    baseCurrency,
                    totalLoanOutPrinTHB,
                    params.exchangeId
                );
            totalLoanOutIntBase = Meteor.call('exchange',
                    "KHR",
                    baseCurrency,
                    totalLoanOutIntKHR,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "USD",
                    baseCurrency,
                    totalLoanOutIntUSD,
                    params.exchangeId
                )
                + Meteor.call('exchange',
                    "THB",
                    baseCurrency,
                    totalLoanOutIntTHB,
                    params.exchangeId
                );
            content += `<tr>
                            <td colspan="12" align="right">Subtotal-KHR</td>
                            <td>${numeral(totalDuePrinKHR).format("(0,00.00)")}</td>
                            <td>${numeral(totalDueIntKHR).format("(0,00.00)")}</td>
                            <td>${numeral(totalDuePrinKHR + totalDueIntKHR).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutPrinKHR).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutIntKHR).format("(0,00.00)")}</td>
                        </tr>
                        <tr>
                            <td colspan="12" align="right">Subtotal-USD</td>
                            <td>${numeral(totalDuePrinUSD).format("(0,00.00)")}</td>
                            <td>${numeral(totalDueIntUSD).format("(0,00.00)")}</td>
                            <td>${numeral(totalDuePrinUSD + totalDueIntUSD).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutPrinUSD).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutIntUSD).format("(0,00.00)")}</td>
                        </tr>
                        <tr>
                            <td colspan="12" align="right">Subtotal-THB</td>
                            <td>${numeral(totalDuePrinTHB).format("(0,00.00)")}</td>
                            <td>${numeral(totalDueIntTHB).format("(0,00.00)")}</td>
                            <td>${numeral(totalDuePrinTHB + totalDueIntTHB).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutPrinTHB).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutIntTHB).format("(0,00.00)")}</td>
                        </tr>
                        <tr>
                            <td colspan="12" align="right">Total-${baseCurrency}</td>
                            <td>${numeral(totalDuePrinBase).format("(0,00.00)")}</td>
                            <td>${numeral(totalDueIntBase).format("(0,00.00)")}</td>
                            <td>${numeral(totalDuePrinBase + totalDueIntBase).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutPrinBase).format("(0,00.00)")}</td>
                            <td>${numeral(totalLoanOutIntBase).format("(0,00.00)")}</td>
                        </tr>
                        
                        
                        </tbody>
                      </table>`;

            data.content = content;
            return data
        }
    }
});

