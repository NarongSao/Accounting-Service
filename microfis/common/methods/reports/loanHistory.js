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
import {Client} from '../../../common/collections/client.js';
import {Fund} from '../../../common/collections/fund.js';


import {RepaymentSchedule} from '../../../common/collections/repayment-schedule.js';
import {Repayment} from '../../../common/collections/repayment';
import {PaymentStatus} from '../../../common/collections/paymentStatus';

// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepayment} from '../check-repayment.js';

export const loanHistoryReport = new ValidatedMethod({
    name: 'microfis.loanHistoryReport',
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


            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";

            header.date = moment(params.date).format("DD/MM/YYYY");
            header.clientId = "All";


            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";


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
            if (params.clientId != "") {
                selector.clientId = params.clientId;
                let clientDoc = Client.findOne({_id: params.clientId});
                if (clientDoc) {
                    header.clientId = clientDoc.khSurname + " " + clientDoc.khGivenName;
                }
            }

            let dateParam = moment(params.date, "DD/MM/YYYY").endOf("day").toDate();
            selector.disbursementDate = {$lte: dateParam};
            // selector['$or'] = [{status: "Active"},
            //     {closeDate: {$exists: true, $gt: dateParam}},
            //     {writeOffDate: {$exists: true, $gt: dateParam}},
            //     {restructureDate: {$exists: true, $gt: dateParam}}
            // ];


            data.header = header;

            //All Active Loan in check date


            let paymentStatusList = PaymentStatus.find({}).fetch();


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
                {$unwind: {path: "$penaltyClosingDoc", preserveNullAndEmptyArrays: true}},

                {$sort: {cycle: 1}}
            ]);


            let checkDate = moment(params.date, "DD/MM/YYYY").toDate();

            if (loanDoc.length > 0) {
                //Loop Active Loan in check date
                content += `<hr>
                    <div class="row">
                        <div class="col-md-12"><b><u>Customer Information</u></b></div>              
                    </div>
                        <br>
                
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Customer Code:</strong> ${loanDoc[0].clientId }</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>En Name:</strong> ${loanDoc[0].clientDoc.enSurname} ${loanDoc[0].clientDoc.enGivenName}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Kh Name:</strong> ${loanDoc[0].clientDoc.khSurname} ${loanDoc[0].clientDoc.khGivenName}</li>
                                    </ul>
                                </div>
                            </div>  
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><b>Kh Nick Name:</b> ${loanDoc[0].clientDoc.khNickname || ""}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><b>Sex:</b> ${loanDoc[0].clientDoc.gender}</div></li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><b>En Nick Name:</b> ${loanDoc[0].clientDoc.enNickname}</li>
                                    </ul>
                                </div>
                            </div> 
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><b>Date Of Birth:</b> ${microfis_formatDate(loanDoc[0].clientDoc.dob)}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><b>Branch Office:</b> ${loanDoc[0].branchId}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><b>Nationality:</b></li>
                                    </ul>
                                </div>
                            </div>`;

                loanDoc.forEach(function (loanAccDoc) {

                        let collateralNote = "";

                        if (loanAccDoc.collateralNote) {
                            collateralNote = loanAccDoc.collateralNote;
                        }
                        content += `
                    <br>
                    <div class="row">
                        <div class="col-md-12"><b><u>Loan Disbursment Information (Cycle: ${loanAccDoc.cycle})</u></b></div>              
                    </div>
                    
                    <br>
                    
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Disbursment Date:</strong> ${microfis_formatDate(loanAccDoc.disbursementDate)}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Fund:</strong> ${loanAccDoc.fundDoc.name}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Product:</strong> ${loanAccDoc.productDoc.name}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Currency:</strong> ${loanAccDoc.currencyId}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Staff Name:</strong> ${loanAccDoc.creditOfficerDoc.enName}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Account Type:</strong> ${loanAccDoc.accountType}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Number Install:</strong> ${microfis_formatDate(loanAccDoc.term)}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Install Frequency:</strong> ${loanAccDoc.repaidFrequency}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Meeting Schedule:</strong> ${loanAccDoc.dueDateOn}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Principal Frequency:</strong> ${loanAccDoc.principalInstallment.frequency}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Principal :</strong> ${microfis_formatNumber(loanAccDoc.principalInstallment.amount)}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Number Payment:</strong> ${loanAccDoc.paymentNumber}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="width: 100%">
                               
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Interest Rate:</strong> ${loanAccDoc.interestRate}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <hr>
                            <br>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Business:</strong></li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Activity:</strong> ${loanAccDoc.purposeActivity || ""}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Disbursment Code:</strong> ${loanAccDoc._id}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Poverty Status:</strong> ${loanAccDoc.povertyLevel || ""}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Collateral Type:</strong> ${loanAccDoc.collateralType || ""}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Client Id:</strong> ${loanAccDoc.clientId}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Income Amount:</strong> </li>
                                        </ul>
                                    </div>=

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Security:</strong> ${loanAccDoc.collateralSecurity || ""}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>ID Type:</strong> ${loanAccDoc.clientDoc.idType}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Handicap:</strong> </li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Security Des:</strong> ${collateralNote || ""}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>ID Number:</strong> ${loanAccDoc.clientDoc.idNumber}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Contact:</strong> ${loanAccDoc.clientDoc.telephone || ""}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Loan Amount:</strong> ${microfis_formatNumber(loanAccDoc.loanAmount)}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Expire Date:</strong> ${microfis_formatDate(loanAccDoc.clientDoc.idExpiryDate)}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>History:</strong> ${loanAccDoc.history || ""}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Education:</strong> </li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Marital Status:</strong> ${loanAccDoc.clientDoc.maritalStatus || ""}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Purpose:</strong> ${loanAccDoc.purpose || ""}</li>
                                        </ul>
                                    </div>

                                    <div style="width: 50%; float: right">
                                        <ul class="list-unstyled">
                                            <li class="pull-right"><strong>Voucher Code:</strong> ${loanAccDoc.voucherId || ""}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Family Member:</strong> </li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                                <div style="width: 60%; float: right">
                                    <div style="width: 50%; float: left">
                                        <ul class="list-unstyled">
                                            <li><strong>Purpose Des:</strong> </li>
                                        </ul>
                                    </div>

                                  
                                </div>
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Number Dependent:</strong> ${loanAccDoc.productDoc.name}</li>
                                    </ul>
                                </div>
                            </div>
                            
                            
                            <div style="width: 100%">
                               
                                <div style="width: 40%;">
                                    <ul class="list-unstyled">
                                        <li><strong>Address:</strong> ${loanAccDoc.clientDoc.address || ""}</li>
                                    </ul>
                                </div>
                            </div>
                    
                    <br>
                    
                    <div class="row">
                        <div class="col-md-12"><b><u>Repayment Schedule</u></b></div>              
                    </div>
                        
                    <br>

                            <table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan" style="display: table-row-group;">
                                <tr> 
                                    <th>No</th>
                                    <th>Due Date</th>
                                    <th>Day Num</th>
                                    <th>Principal</th>
                                    <th>Interest</th>
                                    <th>Operation Fee</th>
                                    <th>Fee</th>
                                    <th>Total</th>
                                    <th>Loan Outstanding</th>
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


                        let lastScheduleDate = RepaymentSchedule.findOne({
                            loanAccId: loanAccDoc._id,
                            scheduleDate: {$lte: checkDate}
                        }, {$sort: {scheduleDate: -1}});

                        let scheduleDoc = RepaymentSchedule.find({
                            loanAccId: loanAccDoc._id,
                            scheduleDate: lastScheduleDate.scheduleDate
                        }).fetch();


                        let paymentDetail = [];

                        scheduleDoc.forEach(function (obj) {
                            if (obj.repaymentDoc && obj.repaymentDoc.detail.length > 0) {
                                paymentDetail = paymentDetail.concat(obj.repaymentDoc.detail);
                            }

                            content += `<tr>
                                <td>${obj.installment}</td>
                                <td>${microfis_formatDate(obj.dueDate)}</td>
                                <td> ${obj.numOfDay}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(obj.principalDue)}</td>
                                <td class="numberAlign"d> ${microfis_formatNumber(obj.interestDue)}</td>
                                <td class="numberAlign"d> ${microfis_formatNumber(obj.feeOnPaymentDue)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(loanAccDoc.feeAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(obj.totalDue + loanAccDoc.feeAmount)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(obj.balance)}</td>    
                            </tr>`;

                            loanAccDoc.feeAmount = 0;
                        })


                        content += `                      
                        
                        </tbody>
                      </table>
                    
                 
                    <div class="row">
                        <div class="col-md-12"><b><u>Loan Collection Information</u></b></div>              
                    </div>
                    <br>
                                   
                    
                     <table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan" style="display: table-row-group;">
                                <tr> 
                                    <th>No</th>
                                    <th>Ref Code</th>
                                    <th>Mention</th>
                                    <th>Classify</th>
                                    <th>Col Date</th>
                                    <th>Col Principal</th>
                                    <th>Col Interest</th>
                                    <th>Col Fee</th>
                                    <th>Col Operation Fee</th>
                                    <th>Col Penalty</th>
                                    <th>Total Collection</th>
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">

                `;

                        let repaymentDoc = Repayment.find({loanAccId: loanAccDoc._id}, {sort: {voucherId: -1}}).fetch();
                        let i = 1;

                        let totalPrincipal = 0;
                        let totalInterest = 0;
                        let totalFee = 0;
                        let totalFeeOnPayment = 0;
                        let totalPenalty = 0;
                        let total = 0;

                        repaymentDoc.forEach(function (obj) {
                            let principal = 0;
                            let interest = 0;
                            let fee = 0;
                            let feeOnPayment = 0;

                            /*let paymentDoc = paymentDetail.find(function (val) {
                             return val.repaymentId == obj._id;
                             })*/
                            // let paymentDoc = paymentDetail.find(x => x.repaymentId == obj._id);


                            let paymentStatusDoc = {};
                            paymentStatusDoc.name = "";

                            let k = 0;

                            if (obj.type == "Fee") {
                                fee = obj.amountPaid;
                            } else {
                                paymentDetail.forEach(function (paymentDoc) {

                                    if (obj._id == paymentDoc.repaymentId) {

                                        principal += paymentDoc.principalPaid;
                                        interest += paymentDoc.interestPaid;
                                        feeOnPayment += paymentDoc.feeOnPaymentPaid;

                                        if (k == 0) {
                                            paymentStatusDoc = paymentStatusList.find(function (val) {
                                                return paymentDoc.numOfDayLate >= val.from && paymentDoc.numOfDayLate <= val.to;
                                            });
                                        }
                                        k++;
                                    }
                                })
                            }


                            totalPrincipal += principal;
                            totalInterest += interest;
                            totalFee += fee;
                            totalFeeOnPayment += feeOnPayment;
                            totalPenalty += obj.penaltyPaid;
                            total += principal + interest + feeOnPayment + fee + obj.penaltyPaid;

                            content += `<tr>
                                <td>${i}</td>
                                <td>${(obj.voucherId).substr(8, obj.voucherId.length - 1)}</td>
                                <td> ${obj.type}</td>
                                <td> ${paymentStatusDoc.name}</td>
                                <td> ${microfis_formatDate(obj.repaidDate)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principal)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(interest)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(fee)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(feeOnPayment)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(obj.penaltyPaid)}</td>
                                <td class="numberAlign"> ${microfis_formatNumber(principal + interest + feeOnPayment + fee + obj.penaltyPaid)}</td>    
                            </tr>`;

                            i++;
                        })

                        content += `                      
                        <tr>
                                <th colspan="5" style="text-align: right"><strong>Total: </strong></th>
                                <th class="numberAlign"> ${microfis_formatNumber(totalPrincipal)}</th>
                                <th class="numberAlign"> ${microfis_formatNumber(totalInterest)}</th>
                                <th class="numberAlign"> ${microfis_formatNumber(totalFee)}</th>
                                <th class="numberAlign"> ${microfis_formatNumber(totalFeeOnPayment)}</th>
                                <th class="numberAlign"> ${microfis_formatNumber(totalPenalty)}</th>
                                <th class="numberAlign"> ${microfis_formatNumber(total)}</th>    
                        </tr>
                        </tbody>
                      </table>`;


                    }
                )

            }

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

