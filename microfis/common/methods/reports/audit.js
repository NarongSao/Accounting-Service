import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import {round2} from 'meteor/theara:round2';
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
import {GroupLoan} from '../../../common/collections/groupLoan';


import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

export const auditReport = new ValidatedMethod({
    name: 'microfis.auditReport',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        params: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({params}) {
        if (!this.isSimulation) {
            // Meteor._sleepForMs(200);
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


            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";
            header.creditOfficerId = "All";
            header.currencyId = "All";
            header.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

            header.date = moment(params.date).format("DD/MM/YYYY");
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
                                <!--<tr> 
                                    <th>No</th>
                                    <th>LA Code</th>
                                    <th>Client Name</th>
                                    <th>Product Name</th>
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
                                    <th>Due Fee</th>
                                    <th>Total Due</th>
                                    <th>Loan Out Prin</th>
                                    <th>Loan Out Int</th>
                                    <th>Loan Out Fee</th>
                                </tr>-->
                                
                                <tr>
                                    <th>No</th>
                                    <th>LA Code</th>
                                    <th>CA Name</th>
                                    <th>District</th>
                                    <th>Commune</th>
                                    <th>Village</th>
                                    <th>Client Name</th>
                                    <th>Gender</th>
                                    <th>Principal</th>
                                    <th>Disbursement Date</th>
                                    <th>Maturity Date</th>
                                    <th>Group</th>
                                    <th>Category</th>
                                    <th>Projected Interest</th>
                                    <th>Principal + Projected Interest</th>
                                    <th>Interest Collect In Period</th>
                                    <th>Principal Collect In Period</th>
                                    <th>Total Collect In Period</th>
                                    <th>Interest Collect To Date</th>
                                    <th>Principal Collect To Date</th>
                                    <th>Total Collect To Date</th>
                                    <th>Principal Over Due</th>
                                    <th>Interest Over Due</th>
                                    <th>Number day Over Due</th>
                                    <th>Loan Status</th>
                                    <th>Total Over Due</th>
                                    <th>Principal OS</th>
                                    <th>Interest OS</th>
                                    <th>Total OS</th>
                                    <th>AIR This Period</th>
                                    <th>AIR OS</th>
                                    <th>Currency</th>
                                    <th>Branch</th>
                                    <th>Loan Rate</th>
                                    <th>No Of Year</th>
                                    <th>Period</th>
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

            let selectorGroupLoan={};
            if (params.branchId && params.branchId.includes("All") == false) {
                selector.branchId = {$in: params.branchId};
                selectorGroupLoan.branchId = {$in: params.branchId};

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


            let groupLoanList=GroupLoan.aggregate([
                {$match: selectorGroupLoan},
                {
                    $unwind: "$loan"
                }
            ]);

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


            let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
            selector.disbursementDate = {$lte: dateParam};
            selector['$or'] = [{status: "Active"},
                {closeDate: {$exists: true, $gt: dateParam}},
                {writeOffDate: {$exists: true, $gt: dateParam}},
                {restructureDate: {$exists: true, $gt: dateParam}},
                {waivedDate: {$exists: true, $gt: dateParam}}
            ];


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
                        from: "microfis_location",
                        localField: "locationDoc.parent",
                        foreignField: "_id",
                        as: "communeDoc"
                    }
                },
                {$unwind: {path: "$communeDoc", preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "microfis_location",
                        localField: "communeDoc.parent",
                        foreignField: "_id",
                        as: "districtDoc"
                    }
                },
                {$unwind: {path: "$districtDoc", preserveNullAndEmptyArrays: true}},
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


            let totalDuePrinKHR = 0;
            let totalDueIntKHR = 0;
            let totalLoanOutPrinKHR = 0;
            let totalLoanOutIntKHR = 0;
            let totalPeriodPrinKHR = 0;
            let totalPeriodIntKHR = 0;
            let totalToDatePrinKHR = 0;
            let totalToDateIntKHR = 0;
            let totalOverDuePrinKHR = 0;
            let totalOverDueIntKHR = 0;
            let totalOSPrinKHR = 0;
            let totalOSIntKHR = 0;
            let totalAIRPeriodKHR = 0;
            let totalAIROSKHR = 0;

            let aIRPeriod = 0;
            let aIROS= 0;


            let totalDuePrinUSD = 0;
            let totalDueIntUSD = 0;
            let totalLoanOutPrinUSD = 0;
            let totalLoanOutIntUSD = 0;
            let totalPeriodPrinUSD= 0;
            let totalPeriodIntUSD = 0;
            let totalToDatePrinUSD = 0;
            let totalToDateIntUSD = 0;
            let totalOverDuePrinUSD = 0;
            let totalOverDueIntUSD = 0;
            let totalOSPrinUSD = 0;
            let totalOSIntUSD = 0;
            let totalAIRPeriodUSD = 0;
            let totalAIROSUSD = 0;


            let totalDuePrinTHB = 0;
            let totalDueIntTHB = 0;
            let totalLoanOutPrinTHB = 0;
            let totalLoanOutIntTHB = 0;
            let totalPeriodPrinTHB= 0;
            let totalPeriodIntTHB = 0;
            let totalToDatePrinTHB = 0;
            let totalToDateIntTHB = 0;
            let totalOverDuePrinTHB= 0;
            let totalOverDueIntTHB = 0;
            let totalOSPrinTHB = 0;
            let totalOSIntTHB = 0;
            let totalAIRPeriodTHB = 0;
            let totalAIROSTHB = 0;


            let totalDuePrinBase = 0;
            let totalDueIntBase = 0;
            let totalLoanOutPrinBase = 0;
            let totalLoanOutIntBase = 0;
            let totalPeriodPrinBase = 0;
            let totalPeriodIntBase = 0;
            let totalToDatePrinBase = 0;
            let totalToDateIntBase = 0;
            let totalOverDuePrinBase = 0;
            let totalOverDueIntBase = 0;
            let totalOSPrinBase = 0;
            let totalOSIntBase = 0;
            let totalAIRPeriodBase= 0;
            let totalAIROSBase = 0;


            if (loanDoc.length > 0) {
                loanDoc.forEach(function (loanAccDoc) {
                    let result = checkRepayment.run({
                        loanAccId: loanAccDoc._id,
                        checkDate: checkDate,
                        opts: loanAccDoc
                    });

                    // Check currency
                    let _round = {
                        type: 'general',
                        precision: -2 // KHR
                    };
                    switch (loanAccDoc.currencyId) {
                        case 'USD':
                            _round.precision = 2;
                            break;
                        case 'THB':
                            _round.precision = 0;
                            break;
                    }

                    let productStatusList;
                    let groupName="";
                    if(loanAccDoc.accountType=="GL"){
                        let groupLoanDoc=groupLoanList.find((o)=>o.loan.id==loanAccDoc._id);
                        if(groupLoanDoc){
                            groupName=groupLoanDoc.groupName;
                        }
                    }

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


                    let finProductStatus = function (obj) {
                        return (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) >= obj.from && (result.totalScheduleDue.numOfDayLate < 0 ? 0 : result.totalScheduleDue.numOfDayLate) <= obj.to;
                    }
                    let proStatus = productStatusList.find(finProductStatus);
                    //check product status (Classify)
                    if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {

                        let arrDayThisPeriod= moment(params.date).startOf('day').diff(loanAccDoc.disbursementDate, 'days');
                        let arrDayOS= moment(params.date).startOf('day').diff(result.totalSchedulePrevious.dueDate.to!=null? result.totalSchedulePrevious.dueDate.to : loanAccDoc.disbursementDate , 'days');

                        if (loanAccDoc.currencyId == "KHR") {
                            totalDuePrinKHR += result.totalScheduleDue.principalDue;
                            totalDueIntKHR += result.totalScheduleDue.interestDue;
                            totalLoanOutPrinKHR += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntKHR += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;

                            totalPeriodPrinKHR += loanAccDoc.projectInterest-result.totalScheduleNext.interestDue-result.totalScheduleDue.interestDue;
                            totalPeriodIntKHR += loanAccDoc.loanAmount-result.totalScheduleNext.principalDue-result.totalScheduleDue.principalDue;
                            totalToDatePrinKHR += result.totalScheduleDue.principalDue;
                            totalToDateIntKHR += result.totalScheduleDue.interestDue;
                            totalOverDuePrinKHR += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.principalDue: 0  ;
                            totalOverDueIntKHR += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.interestDue : 0  ;
                            totalOSPrinKHR += result.totalScheduleDue.principalDue + result.totalScheduleNext.principalDue;
                            totalOSIntKHR += result.totalScheduleDue.interestDue + result.totalScheduleNext.interestDue;
                            totalAIRPeriodKHR += 0;
                            totalAIROSKHR += 0;




                            //AIR
                            if(loanAccDoc.paymentMethod=="D"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodKHR+=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodKHR+=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }

                            }else if(loanAccDoc.paymentMethod=="W"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodKHR+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodKHR+=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                }
                            }else if(loanAccDoc.paymentMethod=="M"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodKHR+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                }else {
                                    totalAIRPeriodKHR+=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);
                                }
                            }else if(loanAccDoc.paymentMethod=="Y"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodKHR+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodKHR+=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSKHR+=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);
                                }
                            }

                        } else if (loanAccDoc.currencyId == "USD") {
                            totalDuePrinUSD += result.totalScheduleDue.principalDue;
                            totalDueIntUSD += result.totalScheduleDue.interestDue;
                            totalLoanOutPrinUSD += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntUSD += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;

                            totalPeriodPrinUSD+= loanAccDoc.projectInterest-result.totalScheduleNext.interestDue-result.totalScheduleDue.interestDue;
                            totalPeriodIntUSD += loanAccDoc.loanAmount-result.totalScheduleNext.principalDue-result.totalScheduleDue.principalDue;
                            totalToDatePrinUSD+= result.totalScheduleDue.principalDue;
                            totalToDateIntUSD += result.totalScheduleDue.interestDue;
                            totalOverDuePrinUSD += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.principalDue : 0  ;
                            totalOverDueIntUSD += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.interestDue : 0  ;
                            totalOSPrinUSD += result.totalScheduleDue.principalDue + result.totalScheduleNext.principalDue;
                            totalOSIntUSD += result.totalScheduleDue.interestDue + result.totalScheduleNext.interestDue;
                            totalAIRPeriodUSD+= 0;
                            totalAIROSUSD += 0;


                            //AIR
                            if(loanAccDoc.paymentMethod=="D"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodUSD+=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodUSD+=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }

                            }else if(loanAccDoc.paymentMethod=="W"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodUSD+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodUSD+=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                }
                            }else if(loanAccDoc.paymentMethod=="M"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodUSD+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                }else {
                                    totalAIRPeriodUSD+=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);
                                }
                            }else if(loanAccDoc.paymentMethod=="Y"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodUSD+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodUSD+=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSUSD+=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);
                                }
                            }


                        } else if (loanAccDoc.currencyId == "THB") {
                            totalDuePrinTHB += result.totalScheduleDue.principalDue;
                            totalDueIntTHB += result.totalScheduleDue.interestDue;
                            totalLoanOutPrinTHB += result.totalScheduleNext.principalDue + result.totalScheduleDue.principalDue;
                            totalLoanOutIntTHB += result.totalScheduleNext.interestDue + result.totalScheduleDue.interestDue;


                            totalPeriodPrinTHB  += loanAccDoc.projectInterest-result.totalScheduleNext.interestDue-result.totalScheduleDue.interestDue;
                            totalPeriodIntTHB  += loanAccDoc.loanAmount-result.totalScheduleNext.principalDue-result.totalScheduleDue.principalDue;
                            totalToDatePrinTHB  += result.totalScheduleDue.principalDue;
                            totalToDateIntTHB  += result.totalScheduleDue.interestDue;
                            totalOverDuePrinTHB  += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.principalDue : 0  ;
                            totalOverDueIntTHB  += proStatus._id !="001" && proStatus._id !="005" ? result.totalScheduleDue.interestDue : 0  ;
                            totalOSPrinTHB  += result.totalScheduleDue.principalDue + result.totalScheduleNext.principalDue;
                            totalOSIntTHB  += result.totalScheduleDue.interestDue + result.totalScheduleNext.interestDue;
                            totalAIRPeriodTHB += 0;
                            totalAIROSTHB  += 0;


                            //AIR
                            if(loanAccDoc.paymentMethod=="D"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodTHB+=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodTHB+=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.interestRate * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(loanAccDoc.interestRate * arrDayOS, _round.precision, _round.type);
                                }

                            }else if(loanAccDoc.paymentMethod=="W"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodTHB+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(7*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(7*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodTHB+=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/7) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/7) * arrDayOS, _round.precision, _round.type);

                                }
                            }else if(loanAccDoc.paymentMethod=="M"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodTHB+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(30*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(30*100)) * arrDayOS, _round.precision, _round.type);

                                }else {
                                    totalAIRPeriodTHB+=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/30) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/30) * arrDayOS, _round.precision, _round.type);
                                }
                            }else if(loanAccDoc.paymentMethod=="Y"){
                                if(loanAccDoc.productDoc.interestType=="P"){
                                    totalAIRPeriodTHB+=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2(loanAccDoc.loanAmount * (loanAccDoc.interestRate/(365*100)) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2(result.totalScheduleDue.principalDue * (loanAccDoc.interestRate/(365*100)) * arrDayOS, _round.precision, _round.type);
                                }else {
                                    totalAIRPeriodTHB+=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    totalAIROSTHB+=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);

                                    aIRPeriod=round2((loanAccDoc.interestRate/365) * arrDayThisPeriod, _round.precision, _round.type);
                                    aIROS=round2((loanAccDoc.interestRate/365) * arrDayOS, _round.precision, _round.type);
                                }
                            }

                        }


                        content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>
                                <td> ${loanAccDoc.districtDoc.khName}</td>
                                <td> ${loanAccDoc.communeDoc.khName}</td>
                                <td> ${loanAccDoc.locationDoc.khName}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.clientDoc.gender}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.loanAmount)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.disbursementDate)}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td>${groupName}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.projectInterest+loanAccDoc.loanAmount)}</td>
                                
                                <td>${microfis_formatNumber(loanAccDoc.projectInterest-result.totalScheduleNext.interestDue-result.totalScheduleDue.interestDue)}</td>
                                <td>${microfis_formatNumber(loanAccDoc.loanAmount-result.totalScheduleNext.principalDue-result.totalScheduleDue.principalDue)}</td>
                                <td>${microfis_formatNumber(loanAccDoc.loanAmount-result.totalScheduleNext.principalDue+loanAccDoc.projectInterest-result.totalScheduleNext.interestDue -result.totalScheduleDue.principalDue-result.totalScheduleDue.interestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.interestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.principalDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.interestDue + result.totalScheduleDue.principalDue)}</td>
                                <td>${proStatus._id !="001" && proStatus._id !="005" ? microfis_formatNumber(result.totalScheduleDue.principalDue) : 0  }</td>
                                <td>${proStatus._id !="001" && proStatus._id !="005" ? microfis_formatNumber(result.totalScheduleDue.interestDue) : 0  }</td>
                 
                                <td> ${result.totalScheduleDue.numOfDayLate}</td>
                                <td> ${proStatus.name}</td>
                                <td>${proStatus._id !="001" && proStatus._id !="005" ? microfis_formatNumber(result.totalScheduleDue.principalDue + result.totalScheduleDue.interestDue) : 0  }</td>
                                <td>${microfis_formatNumber(result.totalScheduleDue.principalDue + result.totalScheduleNext.principalDue)}</td>   
                                <td>${microfis_formatNumber(result.totalScheduleDue.interestDue + result.totalScheduleNext.interestDue)}</td>                                    
                                                             
                                <td>${microfis_formatNumber(result.totalScheduleDue.principalDue + result.totalScheduleNext.principalDue+result.totalScheduleDue.interestDue + result.totalScheduleNext.interestDue)}</td>                                    
                                <td>${microfis_formatNumber(aIRPeriod)}</td>
                                <td>${microfis_formatNumber(aIROS)}</td>
                                <td> ${loanAccDoc.currencyId}</td>
                              
                                <td class="numberAlign"> ${loanAccDoc.branchId}</td>
                                <td class="numberAlign">${loanAccDoc.interestRate}</td>
                                <td class="numberAlign">${microfis_formatDate(loanAccDoc.disbursementDate)} To ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                <td class="numberAlign">${loanAccDoc.term}</td>
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



            totalPeriodPrinBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalPeriodIntBase =Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalToDatePrinBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalToDateIntBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalOverDuePrinBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalOverDueIntBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalOSPrinBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalOSIntBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalAIRPeriodBase= Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);
            totalAIROSBase = Meteor.call('microfis_exchange',
                "KHR",
                baseCurrency,
                totalPeriodPrinKHR,
                params.exchangeId
                )
                + Meteor.call('microfis_exchange',
                    "USD",
                    baseCurrency,
                    totalPeriodPrinUSD,
                    params.exchangeId)
                + Meteor.call('microfis_exchange',
                    "THB",
                    baseCurrency,
                    totalPeriodPrinTHB,
                    params.exchangeId);


            content += `<tr>
                            <td colspan="15" align="right">Subtotal-KHR</td>
                   
                            
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinKHR+totalPeriodIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDateIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinKHR+totalToDateIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntKHR)}</td>
                            <td colspan="2"></td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntKHR+totalOverDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntKHR+totalOSPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIRPeriodKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIROSKHR)}</td>
                            <td colspan="5"></td>

                        </tr>
                        <tr>
                            <td colspan="15" align="right">Subtotal-USD</td>
            

                            <td class="numberAlign">${microfis_formatNumber(totalPeriodIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinUSD+totalPeriodIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDateIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinUSD+totalToDateIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntUSD)}</td>
                            <td colspan="2"></td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntUSD+totalOverDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntUSD+totalOSPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIRPeriodUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIROSUSD)}</td>
                            <td colspan="5"></td>

                        </tr>
                        <tr>
                            <td colspan="15" align="right">Subtotal-THB</td>
     
                            
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinTHB+totalPeriodIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDateIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinTHB+totalToDateIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntTHB)}</td>
                            <td colspan="2"></td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntTHB+totalOverDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntTHB+totalOSPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIRPeriodTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIROSTHB)}</td>
                            <td colspan="5"></td>
                        </tr>
                        <tr>
                            <td colspan="15" align="right">Total-${baseCurrency}</td>
               
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalPeriodPrinBase+totalPeriodIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDateIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalToDatePrinBase+totalToDateIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntBase)}</td>
                            <td colspan="2"></td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverDueIntBase+totalOverDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOSIntBase+totalOSPrinBase)}</td>
                            
                            <td class="numberAlign">${microfis_formatNumber(totalAIRPeriodBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalAIROSBase)}</td>
                            <td colspan="5"></td>

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

