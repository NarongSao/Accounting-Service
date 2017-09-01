import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import BigNumber from 'bignumber.js';


import excel from 'node-excel-export';

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
import  {lookupLoanAcc} from '../../../common/methods/lookup-loan-acc.js';
import  {checkRepaymentRealTime} from '../../../common/methods/check-repayment.js';


Meteor.methods({
    collectionSheetExcelReport(params){
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
        let tDate = moment(date, 'DD/MM/YYYY').endOf("days").toDate();


        let exchangeData = Exchange.findOne({_id: params.exchangeId});

        let header = {};

        header.branchId = "All";
        header.creditOfficerId = "All";
        header.currencyId = "All";
        header.exchangeData = moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates);

        header.date = moment(tDate).format("DD/MM/YYYY");
        header.productId = "All";
        header.locationId = "All";

        header.fundId = "All";
        header.classifyId = "All";
        header.paymentMethod = "All";
        header.repayFrequency = "All";


        /*<tr style="border: 0px !important;">
         <th colspan="17" style="border: 0px !important; text-align: center" class="rpt-title-3x rpt-kh-muol">${data.title.company.khName}</th>
         </tr>
         <tr style="border: 0px !important;">
         <th colspan="17" style="border: 0px !important; text-align: center">Monthly savings</th>
         </tr>*/

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
                                    <th>Vill</th>
                                    <th>CRC</th>
                                    <th>Type</th>
                                    <th>Mat Date</th>
                                    <th>Late Date</th>
                                    <th>Due Date</th>  
                                    <th>CO</th>  
                                                                     
                                    <th>Sum Due Prin</th>
                                    <th>Sum Due Int</th>
                                    <th>Sum Due Fee</th>
                                    <th>Total Sum Due</th>
                                    <th>Closing Balance</th>
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

        if (params.classifyId && params.classifyId.includes("All") == false) {
            let classifyList = ProductStatus.find({_id: {$in: params.classifyId}}, {
                fields: {
                    name: 1,
                    _id: 0
                }
            }).fetch().map(function (obj) {
                return obj.name;
            });
            header.classifyId = classifyList;

        }

        if (params.repayFrequency > 0) {
            selector.repaidFrequency = parseInt(params.repayFrequency);
            header.repayFrequency = params.repayFrequency;
        }

        data.header = header;

        selector.disbursementDate = {
            $lte: tDate
        };

        selector['$or'] = [{status: "Active"},
            {closeDate: {$exists: true, $gte: tDate}},
            {writeOffDate: {$exists: true, $gte: tDate}},
            {restructureDate: {$exists: true, $gte: tDate}},
            {waivedDate: {$exists: true, $gte: tDate}}
        ];

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

        let checkDate = tDate;

        //Loop Active Loan in check date


        let totalDuePrinKHR = 0;
        let totalDueIntKHR = 0;
        let totalDueFeeOnPaymentKHR = 0;


        let totalDuePrinUSD = 0;
        let totalDueIntUSD = 0;
        let totalDueFeeOnPaymentUSD = 0;


        let totalDuePrinTHB = 0;
        let totalDueIntTHB = 0;
        let totalDueFeeOnPaymentTHB = 0;


        let totalDuePrinBase = 0;
        let totalDueIntBase = 0;
        let totalDueFeeOnPaymentBase = 0;


        const dataset = [];


        if (loanDoc.length > 0) {
            loanDoc.forEach(function (loanAccDoc) {
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


                let result = checkRepaymentRealTime.run({
                    loanAccId: loanAccDoc._id,
                    checkDate: checkDate,
                    opts: loanAccDoc
                });


                //Check Closing
                let totalSavingBal = new BigNumber(0);
                Meteor.call('microfis_getLastSavingTransaction', loanAccDoc.savingAccId, function (err, dataSavingBal) {
                    if (dataSavingBal) {
                        totalSavingBal += totalSavingBal.plus(dataSavingBal.details.principalBal).plus(dataSavingBal.details.interestBal);
                    }
                });
                let totalClosing = new BigNumber(0);
                if (result && result.totalScheduleDue) {
                    totalClosing = totalClosing.plus(result.totalScheduleDue.totalPrincipalInterestDue).plus(result.totalScheduleDue.penaltyDue);
                }
                if (result && result.closing) {
                    totalClosing = totalClosing.plus(result.closing.totalDue).minus(totalSavingBal);
                }
                //=================


                if (result.totalScheduleDue.dueDate.from) {
                    if (moment(result.totalScheduleDue.dueDate.from).toDate().getTime() >= moment(params.date, "DD/MM/YYYY").startOf("day").toDate().getTime()) {
                        result.totalScheduleDue.dueDate.from = null;
                    }
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
                    if (result.totalScheduleDue.dueDate.to != null) {
                        if (loanAccDoc.currencyId == "KHR") {
                            totalDuePrinKHR += result.totalScheduleDue.principalDue;
                            totalDueIntKHR += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentKHR += result.totalScheduleDue.feeOnPaymentDue;

                        } else if (loanAccDoc.currencyId == "USD") {
                            totalDuePrinUSD += result.totalScheduleDue.principalDue;
                            totalDueIntUSD += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentUSD += result.totalScheduleDue.feeOnPaymentDue;
                        } else if (loanAccDoc.currencyId == "THB") {
                            totalDuePrinTHB += result.totalScheduleDue.principalDue;
                            totalDueIntTHB += result.totalScheduleDue.interestDue;
                            totalDueFeeOnPaymentTHB += result.totalScheduleDue.feeOnPaymentDue;
                        }


                        dataset.push(
                            {
                                no: i,
                                la_code: loanAccDoc._id,
                                clientName: loanAccDoc.clientDoc.khSurname + " " + loanAccDoc.clientDoc.khGivenName,
                                productName: loanAccDoc.productDoc.name,
                                vill: loanAccDoc.locationDoc.khName,
                                crc: loanAccDoc.currencyId,
                                type: loanAccDoc.accountType,
                                matDate: loanAccDoc.maturityDate,
                                lateDate: microfis_formatDate(result.totalScheduleDue.dueDate.from),
                                dueDate: microfis_formatDate(result.totalScheduleDue.dueDate.to),
                                co: loanAccDoc.creditOfficerDoc.khName,
                                sumDuePrin: microfis_formatNumber(result.totalScheduleDue.principalDue),
                                sumDueInt: microfis_formatNumber(result.totalScheduleDue.interestDue),
                                sumDueFee: microfis_formatNumber(result.totalScheduleDue.feeOnPaymentDue),
                                totalSumDue: microfis_formatNumber(result.totalScheduleDue.totalPrincipalInterestDue),
                                closingBal: microfis_formatNumber(totalClosing),
                                tel: loanAccDoc.clientDoc.telephone || ''
                            }
                        )


                        content += `<tr>
                                <td>${i}</td>
                                <td>${loanAccDoc._id}</td>
                                <td> ${loanAccDoc.clientDoc.khSurname}  ${loanAccDoc.clientDoc.khGivenName} </td>
                                <td> ${loanAccDoc.productDoc.name}</td>
                                <td> ${loanAccDoc.locationDoc.khName}</td>

                                <td> ${loanAccDoc.currencyId}</td>
                                <td> ${loanAccDoc.accountType}</td>
                                <td> ${microfis_formatDate(loanAccDoc.maturityDate)}</td>
                                

                                <td> ${microfis_formatDate(result.totalScheduleDue.dueDate.from)}</td>
                                <td> ${microfis_formatDate(result.totalScheduleDue.dueDate.to)}</td>
                                <td> ${loanAccDoc.creditOfficerDoc.khName}</td>

                               
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.principalDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.interestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.feeOnPaymentDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(result.totalScheduleDue.totalPrincipalInterestDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(totalClosing)}</td>
                                
                                <td> ${loanAccDoc.clientDoc.telephone || ''}</td>
                              </tr>`;

                        i++;
                    }
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


        content += `<tr>
                            <td colspan="11" align="right">Subtotal-KHR</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentKHR)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinKHR + totalDueIntKHR + totalDueFeeOnPaymentKHR)}</td>
                            <td></td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="11" align="right">Subtotal-USD</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentUSD)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinUSD + totalDueIntUSD + totalDueFeeOnPaymentUSD)}</td>
                            <td></td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="11" align="right">Subtotal-THB</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentTHB)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinTHB + totalDueIntTHB + totalDueFeeOnPaymentTHB)}</td>
                            <td></td>
                            <td></td>

                        </tr>
                        <tr>
                            <td colspan="11" align="right">Total-${baseCurrency}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueIntBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDueFeeOnPaymentBase)}</td>
                            <td class="numberAlign">${microfis_formatNumber(totalDuePrinBase + totalDueIntBase + totalDueFeeOnPaymentBase)}</td>
                            <td></td>
                            <td></td>
                        </tr>   
                    
                        </tbody>
                      </table>`;


        // You can define styles as json object
        // More info: https://github.com/protobi/js-xlsx#cell-styles
        const styles = {
            headerDark: {
                fill: {
                    fgColor: {
                        rgb: 'FF000000'
                    }
                },
                font: {
                    color: {
                        rgb: 'FFFFFFFF'
                    },
                    sz: 14,
                    bold: true,
                    underline: true
                }
            },
            headerGrey: {
                fill: {
                    fgColor: {
                        rgb: "545454"
                    }
                },
                font: {
                    color: {
                        rgb: 'FFFFFFFF'
                    },
                    sz: 12,
                    bold: true,
                    underline: true
                }
            },
            cellPink: {
                fill: {
                    fgColor: {
                        rgb: 'FFFFCCFF'
                    }
                }
            },
            cellGreen: {
                fill: {
                    fgColor: {
                        rgb: 'FF00FF00'
                    }
                }
            },
            cellWhite: {
                border: {
                    top: {style: "thin", color: {rgb: "000000"}},
                    bottom: {style: "thin", color: {rgb: "000000"}},
                    right: {style: "thin", color: {rgb: "000000"}},
                    left: {style: "thin", color: {rgb: "000000"}}
                }
            },
            cellHeadCenter: {
                alignment: {
                    vertical: "center",
                    horizontal: "center"
                }
            },
            cellHeadLeft: {
                alignment: {
                    vertical: "center",
                    horizontal: "left"
                }
            },
            cellHeadRight: {
                alignment: {
                    vertical: "center",
                    horizontal: "right"
                }
            }
        };

        //Array of objects representing heading rows (very top)
        const heading = [
            [
                {value: "Branch: " + header.branchId, style: styles.cellHeadLeft},
                {value: ""},
                {value: ""},
                {value: ""},
                {value: ""},
                {
                    value: 'Date :',
                    style: styles.cellHeadLeft
                },
                {value: ""},
                {value: ""},
                {value: ""},
                {value: ""},
                {
                    value: 'Fund: ',
                    style: styles.cellHeadRight
                }]
            // , ['a2', 'b2', 'c2'] // <-- It can be only values*!/
        ];

        //Here you specify the export structure
        const specification = {
            no: { // <- the key should match the actual data key
                displayName: 'No', // <- Here you specify the column header
                headerStyle: styles.cellHeadCenter, // <- Header style
                cellStyle: styles.cellWhite,
                width: 70 // <- width in pixels
            },
            la_code: {
                displayName: 'LA Code',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style

                /*cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property
                 return (value == 1) ? 'Active' : 'Inactive';
                 },*/
                width: 200// <- width in chars (when the number is passed as string)
            },
            clientName: {
                displayName: 'Client Name',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            productName: {
                displayName: 'Product Name',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 120 // <- width in pixels
            },
            vill: {
                displayName: 'Village',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            crc: {
                displayName: 'CRC',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            type: {
                displayName: 'Type',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            matDate: {
                displayName: 'Mat Date',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            lateDate: {
                displayName: 'Late Date',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            dueDate: {
                displayName: 'Due Date',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            co: {
                displayName: 'CO',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            sumDuePrin: {
                displayName: 'Sum DuePrint',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            sumDueInt: {
                displayName: 'Sum DueInt',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            sumDueFee: {
                displayName: 'Sum DueFee',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            totalSumDue: {
                displayName: 'Total SumDue',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            closingBal: {
                displayName: 'Closing Bal',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            },
            tel: {
                displayName: 'Tel',
                headerStyle: styles.cellHeadCenter,
                cellStyle: styles.cellWhite, // <- Cell style
                width: 220 // <- width in pixels
            }
        }

        // The data set should have the following shape (Array of Objects)
        // The order of the keys is irrelevant, it is also irrelevant if the
        // dataset contains more fields as the report is build based on the
        // specification provided above. But you should have all the fields
        // that are listed in the report specification


        // Define an array of merges. 1-1 = A:1
        // The merges are independent of the data.
        // A merge will overwrite all data _not_ in the top-left cell.
        const merges = [
            {start: {row: 1, column: 1}, end: {row: 1, column: 5}},
            {start: {row: 1, column: 6}, end: {row: 1, column: 10}},
            {start: {row: 1, column: 11}, end: {row: 1, column: 17}}
        ]

        // Create the excel report.
        // This function will return Buffer
        const report = excel.buildExport(
            [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
                {
                    name: 'Report', // <- Specify sheet name (optional)
                    heading: heading, // <- Raw heading array (optional)
                    merges: merges, // <- Merge cell ranges
                    specification: specification, // <- Report specification
                    data: dataset // <-- Report data
                }
            ]
        );

        // You can then return this straight
        /*res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers)
         return res.send(report);*/

        // OR you can save this buffer to the disk by creating a file.*!/


        data.content = content;
        // return data
        console.log(report);
        return report;
    }
})


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
