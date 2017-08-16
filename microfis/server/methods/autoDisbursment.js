import {LoanAcc} from "../../common/collections/loan-acc";
import {Client} from "../../common/collections/client";
import {SavingAcc} from "../../common/collections/saving-acc";

Meteor.methods({
    'insertDisbursment'(doc){
        let clientDoc = {};
        let savingDoc = {};
        let loanAccDoc = {};

        Meteor.call("insertClient", clientDoc, (err, clientDocResult) => {
            if (clientDocResult) {
                savingDoc.clientId = clientDocResult._id;
                Meteor.call("insertSaving", savingDoc, (err, savingDocResult) => {
                    if (savingDocResult) {
                        loanAccDoc.savingId = savingDocResult._id;
                        loanAccDoc.clientId = clientDocResult._id;
                        LoanAcc.insert({
                            accountType: loanAccDoc.accountType,
                            branchId: loanAccDoc.branchId,
                            clientId: loanAccDoc.clientId,
                            creditOfficerId: loanAccDoc.creditOfficerId,
                            currencyId: loanAccDoc.currencyId,
                            cycle: 1,
                            disbursementDate: loanAccDoc.disbursementDate,
                            dueDateOn: loanAccDoc.dueDateOn,
                            escapeDayFrequency: loanAccDoc.escapeDayFrequency,
                            escapeDayMethod: loanAccDoc.escapeDayMethod,
                            feeAmount: 0,
                            feeDate: loanAccDoc.feeDate,
                            firstRepaymentDate: loanAccDoc.firstRepaymentDate,
                            fundId: loanAccDoc.fundId,
                            installmentAllowClosing: 5,
                            interestMethod: loanAccDoc.interestMethod,
                            interestRate: loanAccDoc.interestRate,
                            isAddToGroup: false,
                            loanAmount: loanAccDoc.loanAmount,
                            locationId: loanAccDoc.locationId,
                            maturityDate: loanAccDoc.maturityDate,
                            paymentLocation: loanAccDoc.paymentLocation,
                            paymentMethod: loanAccDoc.paymentMethod,

                            principalInstallment: {
                                "frequency": 1,
                                "calculateType": "P",
                                "amount": 100
                            },
                            productId: loanAccDoc.productId,
                            projectFeeOnPayment: loanAccDoc.projectFeeOnPayment,
                            projectInterest: loanAccDoc.projectInterest,
                            purpose: "Agriculture",
                            repaidFrequency: 1,
                            savingAccId: loanAccDoc.savingAccId,
                            status: "Active",
                            submitDate: loanAccDoc.submitDate,
                            tenor: loanAccDoc.tenor,
                            term: loanAccDoc.term,
                            voucherId: loanAccDoc.voucherId,
                            waivedForClosing: 0

                        })
                        ;

                    }
                })


            }
        })

    },
    'insertSaving'(doc){
        return SavingAcc.insert({
            clientId: doc.clientId,
            productId: doc.productId,
            accDate: doc.accDate,
            accountType: doc.accountType,
            currencyId: doc.currencyId,
            openingAmount: 0,
            interestRate: 0,
            branchId: doc.branchId,
            status: {
                "value": "Active",
                "activeDate": doc.activeDate
            },
            savingNumber: 1,
            savingLoanNumber: 1
        });
    },
    'insertClient'(doc){
        return Client.insert({
            khSurname: doc.khSurname,
            khGivenName: doc.khGivenName,
            gender: doc.gender,
            dob: doc.dob,
            maritalStatus: doc.maritalStatus,
            idType: doc.idType,
            branchId: doc.branchId,
            address: doc.address
        });
    }
})