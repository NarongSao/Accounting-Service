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

import LocationClass from "./../../../imports/libs/getLocation"

export const loanRepaymentReport = new ValidatedMethod({
        name: 'microfis.loanRepaymentReport',
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
                                        <th>Clear Date</th>
                                        <th>Status</th>	
                                        <th>Address</th>	
                                    <th>Col Prin</th>
                                    <th>Col Int</th>
                                    <th>Col Operation Fee</th>
                                    <th>Over Amount</th>
                                    <th>Total Col</th>
                                    <th>Clear Prepaid</th>
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


                if (params.accountType && params.accountType.includes("All") == false) {
                    selector["loanDoc.accountType"] = params.accountType;
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

                if (params.status !== "All") {
                    selectorRepayment.type = {$eq: params.status, $nin: ["Fee", "Write Off"]};
                    header.status = params.status;
                } else {
                    selectorRepayment.type = {$nin: ["Fee", "Write Off"]};
                }

                selectorRepayment.$or = [
                    {
                        repaidDate: {
                            $gte: fDate,
                            $lte: tDate
                        }
                    }, {
                        endDate: {
                            $gte: fDate,
                            $lte: tDate
                        }
                    },
                    {
                        endDateList: {$elemMatch: {clearDate: {$gte: fDate, $lte: tDate}}}
                    }
                ];


                data.header = header;

                //All Active Loan in check date


                let i = 1;


                //Loop Active Loan in check date


                let totalColPrinKHR = 0;
                let totalColIntKHR = 0;
                let totalColFeeOnPaymentKHR = 0;
                let totalColPrinIntKHR = 0;
                let totalColPenKHR = 0;
                let totalOverAmountKHR = 0;
                let totalClearPrepaidKHR = 0;

                let totalColPrinUSD = 0;
                let totalColIntUSD = 0;
                let totalColFeeOnPaymentUSD = 0;
                let totalColPrinIntUSD = 0;
                let totalColPenUSD = 0;
                let totalOverAmountUSD = 0;
                let totalClearPrepaidUSD = 0;


                let totalColPrinTHB = 0;
                let totalColIntTHB = 0;
                let totalColFeeOnPaymentTHB = 0;
                let totalColPrinIntTHB = 0;
                let totalColPenTHB = 0;
                let totalOverAmountTHB = 0;
                let totalClearPrepaidTHB = 0;


                let totalColPrinBase = 0;
                let totalColIntBase = 0;
                let totalColFeeOnPaymentBase = 0;
                let totalColPrinIntBase = 0;
                let totalColPenBase = 0;
                let totalOverAmountBase = 0;
                let totalClearPrepaidBase = 0;


                let repaidList = Repayment.aggregate([
                        {
                            $match: selectorRepayment
                        },

                        {
                            $lookup: {
                                from: "microfis_repaymentSchedule",
                                localField: "_id",
                                foreignField: "repaymentDoc.detail.repaymentId",
                                as: "scheduleDoc"
                            }
                        },
                        {
                            $unwind: {path: '$scheduleDoc', preserveNullAndEmptyArrays: true}
                        },
                        {

                            $project: {
                                scheduleDoc: {
                                    $filter: {
                                        input: '$scheduleDoc.repaymentDoc.detail',
                                        as: 'payment',
                                        cond: {
                                            $eq: ["$$payment.repaymentId", "$_id"]
                                        }
                                    }
                                },
                                amountPaid: {
                                    $cond: [
                                        {
                                            $and: [
                                                {$gte: ["$repaidDate", fDate]},
                                                {$lte: ["$repaidDate", tDate]}
                                            ]
                                        },
                                        "$amountPaid",
                                        0
                                    ]
                                },
                                clearPrepaid: "$amountPaid",
                                detailDoc: 1,
                                branchId: 1,
                                currencyId: 1,
                                endId: 1,
                                loanAccId: 1,
                                penaltyPaid: 1,
                                repaidDate: 1,
                                savingBalance: 1,
                                type: 1,
                                voucherId: 1,
                                waivedForClosing: 1,
                                clearDate: {$arrayElemAt: ["$scheduleDocRealTime", 0]}

                            }
                        },
                        {
                            $unwind: {path: '$scheduleDoc', preserveNullAndEmptyArrays: true}
                        },
                        {
                            $group: {
                                _id: "$_id",
                                principalPaid: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {$gte: ["$scheduleDoc.repaidDate", fDate]},
                                                    {$lte: ["$scheduleDoc.repaidDate", tDate]}
                                                ]
                                            },
                                            "$scheduleDoc.principalPaid",
                                            0
                                        ]
                                    }
                                },
                                interestPaid: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {$gte: ["$scheduleDoc.repaidDate", fDate]},
                                                    {$lte: ["$scheduleDoc.repaidDate", tDate]}
                                                ]
                                            },
                                            "$scheduleDoc.interestPaid",
                                            0
                                        ]
                                    }

                                },
                                feeOnPaymentPaid: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {$gte: ["$scheduleDoc.repaidDate", fDate]},
                                                    {$lte: ["$scheduleDoc.repaidDate", tDate]}
                                                ]
                                            }
                                            ,
                                            "$scheduleDoc.feeOnPaymentPaid",
                                            0
                                        ]
                                    }
                                }
                                ,
                                penaltyPaid: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {$gte: ["$scheduleDoc.repaidDate", fDate]},
                                                    {$lte: ["$scheduleDoc.repaidDate", tDate]}
                                                ]
                                            },
                                            "$scheduleDoc.penaltyPaid",
                                            0
                                        ]
                                    }
                                }
                                ,
                                amountPaid: {
                                    $last: '$amountPaid'
                                },
                                clearPrepaid: {
                                    $last: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {$gte: ["$scheduleDoc.repaidDate", fDate]},
                                                    {$lte: ["$scheduleDoc.repaidDate", tDate]},
                                                    {
                                                        $eq: ["$type", "Prepay"]
                                                    }
                                                ]
                                            },
                                            {$sum: ["$scheduleDoc.principalPaid", "$scheduleDoc.feeOnPaymentPaid", "$scheduleDoc.interestPaid"]},
                                            // "$clearPrepaid",
                                            0
                                        ]
                                    }
                                }
                                ,
                                branchId: {
                                    $last: "$branchId"
                                }
                                ,
                                detailDoc: {
                                    $last: "$detailDoc"
                                }
                                ,
                                currencyId: {
                                    $last: "$currencyId"
                                }
                                ,
                                endId: {
                                    $last: "$endId"
                                }
                                ,
                                loanAccId: {
                                    $last: "$loanAccId"
                                }
                                ,
                                repaidDate: {
                                    $last: "$repaidDate"
                                }
                                ,
                                savingBalance: {
                                    $last: "$savingBalance"
                                }
                                ,
                                type: {
                                    $last: "$type"
                                }
                                ,
                                voucherId: {
                                    $last: "$voucherId"
                                }
                                ,
                                waivedForClosing: {
                                    $last: "$waivedForClosing"
                                },
                                clearDate: {
                                    $last: "$clearDate.dueDate" || ""
                                }
                            }
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
                        {
                            $unwind: {
                                path: "$loanDoc", preserveNullAndEmptyArrays: true
                            }
                        }
                        ,
                        {
                            $match: selector
                        }
                        ,
                        {
                            $lookup: {
                                from: "microfis_client",
                                localField: "loanDoc.clientId",
                                foreignField: "_id",
                                as: "clientDoc"
                            }
                        }
                        ,
                        {
                            $unwind: {
                                path: "$clientDoc", preserveNullAndEmptyArrays: true
                            }
                        }
                        ,
                        {
                            $lookup: {
                                from: "microfis_product",
                                localField: "loanDoc.productId",
                                foreignField: "_id",
                                as: "productDoc"
                            }
                        }
                        ,
                        {
                            $unwind: {
                                path: "$productDoc", preserveNullAndEmptyArrays: true
                            }
                        }
                        ,
                        {
                            $sort: {
                                voucherId: 1,
                                repaidDate: 1
                            }
                        }
                    ])
                ;


                if (repaidList.length > 0) {
                    repaidList.forEach(function (repaidListDoc) {

                        let productStatusList;
                        if (repaidListDoc.loanDoc.paymentMethod == "D") {
                            if (repaidListDoc.loanDoc.term <= 365) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }

                        } else if (repaidListDoc.loanDoc.paymentMethod == "W") {
                            if (repaidListDoc.loanDoc.term <= 52) {
                                productStatusList = ProductStatus.find({type: "Less Or Equal One Year"}).fetch();
                            } else {
                                productStatusList = ProductStatus.find({type: "Over One Year"}).fetch();
                            }
                        } else if (repaidListDoc.loanDoc.paymentMethod == "M") {
                            if (repaidListDoc.loanDoc.term <= 12) {
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


                        let locationName = LocationClass.getLocationByVillage(repaidListDoc.loanDoc.locationId);


                        let principalPaid = 0;
                        let interestPaid = 0;
                        let feeOnPaymentPaid = 0;
                        let penaltyPaid = 0;


                        let finProductStatus = function (obj) {
                            if (repaidListDoc.type != "Reschedule") {
                                return (repaidListDoc.detailDoc && repaidListDoc.detailDoc.schedulePaid[0].numOfDayLate < 0 ? 0 : repaidListDoc.detailDoc.schedulePaid[0].numOfDayLate) >= obj.from && (repaidListDoc.detailDoc && repaidListDoc.detailDoc.schedulePaid[0].numOfDayLate < 0 ? 0 : repaidListDoc.detailDoc.schedulePaid[0].numOfDayLate) <= obj.to;
                            } else {
                                return 0 >= obj.from && 0 < obj.to;
                            }
                        }
                        let proStatus = productStatusList.find(finProductStatus);

                        //check product status (Classify)
                        if (params.classifyId.includes(proStatus._id) == true || checkClassify == true) {

                            principalPaid = repaidListDoc.principalPaid;
                            interestPaid = repaidListDoc.interestPaid;
                            feeOnPaymentPaid = repaidListDoc.feeOnPaymentPaid;
                            penaltyPaid = repaidListDoc.penaltyPaid;

                            let overAmount;
                            if (repaidListDoc.type == "Prepay") {
                                overAmount = 0;
                            } else {
                                overAmount = repaidListDoc.amountPaid + repaidListDoc.savingBalance - (repaidListDoc.principalPaid + repaidListDoc.interestPaid + repaidListDoc.feeOnPaymentPaid);
                                repaidListDoc.clearPrepaid = repaidListDoc.savingBalance;
                            }


                            if (repaidListDoc.loanDoc.currencyId == "KHR") {

                                totalColPrinKHR += principalPaid;
                                totalColIntKHR += interestPaid;
                                totalColFeeOnPaymentKHR += feeOnPaymentPaid;
                                totalColPrinIntKHR += repaidListDoc.amountPaid;
                                totalOverAmountKHR += overAmount;
                                totalColPenKHR += penaltyPaid;
                                totalClearPrepaidKHR += repaidListDoc.clearPrepaid;


                            } else if (repaidListDoc.loanDoc.currencyId == "USD") {
                                totalColPrinUSD += principalPaid;
                                totalColIntUSD += interestPaid;
                                totalColFeeOnPaymentUSD += feeOnPaymentPaid;
                                totalColPrinIntUSD += repaidListDoc.amountPaid;
                                totalOverAmountUSD += overAmount;
                                totalColPenUSD += penaltyPaid;
                                totalClearPrepaidUSD += repaidListDoc.clearPrepaid;
                            } else if (repaidListDoc.loanDoc.currencyId == "THB") {
                                totalColPrinTHB = principalPaid;
                                totalColIntTHB = interestPaid;
                                totalColFeeOnPaymentTHB = feeOnPaymentPaid;
                                totalColPrinIntTHB += repaidListDoc.amountPaid;
                                totalOverAmountTHB += overAmount;
                                totalColPenTHB = penaltyPaid;
                                totalClearPrepaidTHB += repaidListDoc.clearPrepaid;
                            }


                            content += `<tr>
                 <td>${i}</td>
                 <td>${repaidListDoc.voucherId.substr(8, repaidListDoc.voucherId.length - 1)}</td>
                 <td>${repaidListDoc.loanDoc._id}</td>
                 <td> ${repaidListDoc.clientDoc.khSurname}  ${repaidListDoc.clientDoc.khGivenName} </td>
                 <td> ${repaidListDoc.productDoc.name}</td>

                 <td> ${repaidListDoc.loanDoc.currencyId}</td>
                 <td> ${repaidListDoc.loanDoc.accountType}</td>
                 <td> ${microfis_formatDate(repaidListDoc.loanDoc.disbursementDate)}</td>
                 <td> ${microfis_formatDate(repaidListDoc.loanDoc.maturityDate)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(repaidListDoc.loanDoc.loanAmount)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(repaidListDoc.loanDoc.projectInterest)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(repaidListDoc.loanDoc.projectFeeOnPayment)}</td>

                 <td> ${microfis_formatDate(repaidListDoc.repaidDate)}</td>
                 <td> ${microfis_formatDate(repaidListDoc.clearDate)}</td>
                 
                 <td> ${repaidListDoc.type}</td>
                 <td> ${locationName}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(principalPaid)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(interestPaid)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(feeOnPaymentPaid)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(overAmount)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(repaidListDoc.amountPaid)}</td>
                 <td class="numberAlign"> ${microfis_formatNumber(repaidListDoc.clearPrepaid)}</td>
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

                totalOverAmountBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalOverAmountKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalOverAmountUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalOverAmountTHB,
                        params.exchangeId
                    );

                totalClearPrepaidBase = Meteor.call('microfis_exchange',
                        "KHR",
                        baseCurrency,
                        totalClearPrepaidKHR,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "USD",
                        baseCurrency,
                        totalClearPrepaidUSD,
                        params.exchangeId
                    )
                    + Meteor.call('microfis_exchange',
                        "THB",
                        baseCurrency,
                        totalClearPrepaidTHB,
                        params.exchangeId
                    );
                content += `<tr>
                            <td colspan="16" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverAmountKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalClearPrepaidKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenKHR)}</td>
                        </tr>
                        <tr>
                            <td colspan="16" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverAmountUSD)}</td>

                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalClearPrepaidUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenUSD)}</td>

                        </tr>
                        <tr>
                            <td colspan="16" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverAmountTHB)}</td>

                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalClearPrepaidTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPenTHB)}</td>

                        </tr>
                        <tr>
                            <td colspan="16" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColPrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalColFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalOverAmountBase)}</td>

                            <td class="numberAlign">${microfis_formatNumber(totalColPrinIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalClearPrepaidBase)}</td>
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

