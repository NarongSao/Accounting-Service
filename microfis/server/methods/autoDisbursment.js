import {LoanAcc} from "../../common/collections/loan-acc";
import {Client} from "../../common/collections/client";
import {SavingAcc} from "../../common/collections/saving-acc";
import {CreditOfficer} from "../../common/collections/credit-officer";
import {Product} from "../../common/collections/product";

Meteor.methods({
    'insertDisbursment'(){
        console.log("Call Method Insert Disbursment");
        let i = 1;
        //disbursment.json
        let data = JSON.parse(Assets.getText('disbursement.json')).disbursement;
        data.forEach(function (result) {
            try {
                //Doc Example
                let doc = {};


                doc.khSurname = result.FirstName;
                doc.khGivenName = result.LastName;
                doc.gender = result.Gender;
                doc.dob = moment(result.DOB, "DD/MM/YYYY").toDate();
                doc.address = result.Address;

                // doc.disbursementDate = moment(result.DisDate, "DD/MM/YYYY").toDate();
                doc.disbursementDate = moment(result.DisDate, "MM/DD/YYYY").toDate();
                doc.accountType = result.AccType;
                doc.currencyId = result.Currency;
                // doc.firstRepaymentDate = moment(result.FirstRepaymentDate, "DD/MM/YYYY").add(1, "day").toDate();
                doc.firstRepaymentDate = moment(result.FirstRepaymentDate, "MM/DD/YYYY").add(1, "day").toDate();
                doc.interestRate = parseFloat(result.InterestRate);
                doc.loanAmount = parseFloat(result.LoanOutPrin);
                doc.locationId = result.AddressCode;
                doc.term = parseInt(result.Term);
                doc.creditOfficerName = result.CO;

                doc.branchId = result.BranchId;
                doc.productId = "0" + result.ProductId;
                doc.dueDateOn = parseInt(result.DueDateOn);
                doc.repaidFrequency = parseInt(result.RepaidFrequency);

                doc.loanOutFee = parseFloat(result.LoanOutFee);
                doc.loanOutInt = parseFloat(result.LoanOutInt);



                if (result.WriteOffDate) {
                    doc.writeOffDate = moment(result.WriteOffDate, "DD/MM/YYYY").toDate();
                }

                if (result.LossDate) {
                    doc.lossDate = moment(result.LossDate, "DD/MM/YYYY").toDate();
                }
                if (result.LateDate) {
                    doc.lateDate = moment(result.LateDate, "DD/MM/YYYY").toDate();
                }

                /*doc.khSurname = "Test";
                 doc.khGivenName = "Test";
                 doc.gender = "F";
                 doc.dob = moment().add(-25, "year").toDate();
                 doc.address = "Battambang";

                 doc.disbursementDate = moment("12/02/2016", "DD/MM/YYYY").toDate();
                 doc.accountType = "IL";
                 doc.currencyId = "KHR";
                 doc.firstRepaymentDate = moment("20/02/2016", "DD/MM/YYYY").toDate();
                 doc.interestRate = 0.37;
                 doc.loanAmount = 1000000;
                 doc.locationId = "02030702";
                 doc.term = 10;
                 doc.creditOfficerName = "GG";

                 doc.branchId = "001";
                 doc.productId = "008";*/


                //Client Doc
                let clientDoc = {};
                clientDoc.khSurname = doc.khSurname;
                clientDoc.khGivenName = doc.khGivenName;
                clientDoc.gender = doc.gender;
                clientDoc.dob = doc.dob;
                clientDoc.address = doc.address;

                clientDoc.branchId = doc.branchId;


                //Saving Doc
                let savingDoc = {};

                savingDoc.accDate = doc.disbursementDate;
                savingDoc.currencyId = doc.currencyId;
                savingDoc.branchId = doc.branchId;


                //Loan Account
                let loanAccDoc = {};
                loanAccDoc.accountType = doc.accountType;
                loanAccDoc.branchId = doc.branchId;
                loanAccDoc.currencyId = doc.currencyId;
                loanAccDoc.disbursementDate = doc.disbursementDate;
                loanAccDoc.firstRepaymentDate = doc.firstRepaymentDate;
                loanAccDoc.interestRate = doc.interestRate;
                loanAccDoc.loanAmount = doc.loanAmount;
                loanAccDoc.locationId = doc.locationId;
                loanAccDoc.term = doc.term;
                loanAccDoc.productId = doc.productId;

                loanAccDoc.dueDateOn = doc.dueDateOn;
                loanAccDoc.repaidFrequency = doc.repaidFrequency;


                //WriteOff
                let writeOff = {};
                if (doc.writeOffDate) {
                    writeOff.writeOffDate = doc.writeOffDate;
                    writeOff.lateDate = doc.lateDate;
                    writeOff.lossDate = doc.lossDate;
                    writeOff.loanAmount = doc.loanAmount;
                    writeOff.loanOutInt = doc.loanOutInt;
                    writeOff.loanOutFee = doc.loanOutFee;
                }

                let productDoc = Product.findOne({_id: doc.productId});
                Meteor.call("insertCO", doc.creditOfficerName, doc.branchId, (err, coId) => {
                    if (coId) {
                        loanAccDoc.creditOfficerId = coId;
                        Meteor.call("insertClient", clientDoc, (error, clientDocId) => {
                            if (clientDocId) {
                                savingDoc.clientId = clientDocId;
                                Meteor.call("insertSaving", savingDoc, (err, savingDocId) => {
                                    if (savingDocId) {
                                        loanAccDoc.savingId = savingDocId;
                                        loanAccDoc.clientId = clientDocId;

                                        let loanId = LoanAcc.insert({
                                            accountType: loanAccDoc.accountType,
                                            branchId: loanAccDoc.branchId,
                                            creditOfficerId: loanAccDoc.creditOfficerId,
                                            currencyId: loanAccDoc.currencyId,
                                            disbursementDate: loanAccDoc.disbursementDate,

                                            firstRepaymentDate: loanAccDoc.firstRepaymentDate,
                                            interestMethod: productDoc.interestMethod,
                                            interestType: productDoc.interestType,
                                            interestRate: loanAccDoc.interestRate,
                                            loanAmount: loanAccDoc.loanAmount,
                                            locationId: loanAccDoc.locationId,
                                            paymentMethod: productDoc.paymentMethod,
                                            submitDate: loanAccDoc.disbursementDate,
                                            term: loanAccDoc.term,
                                            productId: loanAccDoc.productId,

                                            savingAccId: loanAccDoc.savingId,
                                            clientId: loanAccDoc.clientId,
                                            dueDateOn: loanAccDoc.dueDateOn,
                                            repaidFrequency: loanAccDoc.repaidFrequency,


                                            paymentLocation: "Village",
                                            geography: "S",
                                            fundId: "001",
                                            cycle: 1,
                                            escapeDayFrequency: 1,
                                            escapeDayMethod: "GR",
                                            feeAmount: 0,
                                            isAddToGroup: false,
                                            principalInstallment: {
                                                "frequency": 1,
                                                "calculateType": "P",
                                                "amount": 100
                                            },
                                            purpose: "Agriculture",
                                            status: "Active",
                                            waivedForClosing: 0,
                                            autoDis: "001"

                                        });


                                        i++;
                                        if (loanId && doc.writeOffDate) {

                                            writeOff.loanAccId = loanId;
                                            Meteor.call("insertWriteOff", writeOff, (err, writeOffResult) => {
                                                if (writeOffResult) {
                                                    console.log("Write Off : " + loanId);
                                                } else {
                                                    console.log(err.message);
                                                }
                                            })

                                        }
                                        console.log("===========================");
                                    }
                                })


                            } else {
                                console.log(error)
                                throw new Meteor.Error("Stop 1");
                            }
                        })
                    } else {

                        console.log(err)
                        throw new Meteor.Error("Stop 2");
                    }
                })

            } catch (erro) {

                console.log(erro.message)
                throw new Meteor.Error("Stop 3");

            }
        })


    },
    'insertSaving'(doc){
        return SavingAcc.insert({
            clientId: doc.clientId,
            accDate: doc.accDate,
            currencyId: doc.currencyId,
            branchId: doc.branchId,

            status: {
                "activeDate": doc.accDate,
                "value": "Active"
            },
            productId: "001",
            accountType: "S",
            operationType: "None",
            openingAmount: 0,
            interestRate: 0,
            savingNumber: 0,
            savingLoanNumber: 0,
            autoDis: "001"
        });
    },
    'insertClient'(doc){
        return Client.insert({
            khSurname: doc.khSurname,
            khGivenName: doc.khGivenName,
            enGivenName: doc.khGivenName,
            enSurname: doc.khSurname,

            gender: doc.gender,
            dob: doc.dob,
            address: doc.address,
            branchId: doc.branchId,


            cycle: 0,
            idType: "F",
            maritalStatus: "S",
            autoDis: "001"
        });
    },
    insertCO(name, branchId){
        let coDoc = CreditOfficer.findOne({$or: [{khName: name}, {enName: name}]});
        if (coDoc) {
            return coDoc._id;
        } else {
            let id = CreditOfficer.insert({
                khName: name,
                enName: name,
                dob: moment().toDate(),
                gender: "M",
                address: "BTB",
                branchId: branchId,
                autoDis: "001"
            });
            if (id) {
                return id;
            } else {
                throw new Meteor.Error("Can not Insert Credit Officer");
            }
        }
    },
    insertWriteOff(doc){

        let opts = {};
        let writeOff = {};
        let paymentWriteOff = [];
        let paymentDoc = {};

        writeOff.writeOffDate = doc.writeOffDate;
        writeOff.lateDate = doc.lateDate;
        writeOff.lossDate = doc.lossDate;
        writeOff.amount = doc.loanAmount;
        writeOff.interest = doc.loanOutInt;
        writeOff.feeOnPayment = doc.loanOutFee;


        opts.writeOff = writeOff;

        paymentDoc.rePaidDate = doc.writeOffDate;
        paymentDoc.amount = 0;
        paymentDoc.interest = 0;
        paymentDoc.feeOnPayment = 0;

        paymentDoc.unPaidPrincipal = doc.loanAmount;
        paymentDoc.unPaidInterest = doc.loanOutInt;
        paymentDoc.unPaidFeeOnPayment = doc.loanOutFee;

        paymentWriteOff.push(paymentDoc);


        opts.paymentWriteOff = paymentWriteOff;
        opts.status = "Write Off";
        opts.writeOffDate = doc.writeOffDate;

        return LoanAcc.direct.update({_id: doc.loanAccId}, {
            $set: opts
        });

    },

    removeAutoDis(){

        /*
         //Convert JSON Online
         //http://beautifytools.com/excel-to-json-converter.php


         db.microfis_savingAcc.remove({autoDis: "001"})
         let loanList=db.microfis_loanAcc.find({autoDis:"001"});

         loanList.forEach(function(obj){
         db.microfis_repaymentSchedule.remove({loanAccId: obj._id})
         db.accJournal.remove({refId: obj._id,refFrom: "Disbursement"})
         })


         db.microfis_loanAcc.remove({autoDis:"001"})
         db.microfis_client.remove({autoDis:"001"})
         db.microfis_creditOfficer.remove({autoDis: "001"})
         */
    }

})