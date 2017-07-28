import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LoanAcc} from '../../common/collections/loan-acc.js';
import {Client} from '../../common/collections/client';
import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';
import {Setting} from '../../../core/common/collections/setting.js';

export const makeWriteOffEnsure = new ValidatedMethod({
    name: 'microfis.makeWriteOffEnsure',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {type: String},
        opts: {type: Object, optional: true, blackbox: true},
        isEnsure: {type: Boolean}
    }).validator(),
    run({loanAccId, opts, isEnsure}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(100);

            if (isEnsure == true) {
                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {

                    let loanAcc = LoanAcc.findOne(loanAccId);
                    let clientDoc = Client.findOne({_id: loanAcc.clientId});
                    let dataForAccount = {};

                    dataForAccount.journalDate = opts['writeOff.writeOffDate'];
                    dataForAccount.branchId = loanAcc.branchId;
                    dataForAccount.voucherId = "";
                    dataForAccount.currencyId = loanAcc.currencyId;
                    dataForAccount.memo = "Write Off " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                    dataForAccount.refId = loanAcc._id;
                    dataForAccount.refFrom = "Write Off Ensure";
                    dataForAccount.total = opts['writeOff.amount'];

                    let transaction = [];


                    let acc_badDoubtfulGeneral = MapClosing.findOne({chartAccountCompare: "Bad Doubtful General"});
                    let acc_principal = checkPrincipal(loanAcc);


                    transaction.push({
                        account: acc_badDoubtfulGeneral.accountDoc.code + " | " + acc_badDoubtfulGeneral.accountDoc.name,
                        dr: opts['writeOff.amount'],
                        cr: 0,
                        drcr: opts['writeOff.amount']

                    }, {
                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                        dr: 0,
                        cr: opts['writeOff.amount'],
                        drcr: -opts['writeOff.amount']
                    });


                    dataForAccount.transaction = transaction;
                    Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                        if (err) {
                            console.log(err.message);
                        }
                    })
                }
            } else {
                let settingDoc = Setting.findOne();
                if (settingDoc.integrate == true) {

                    let loanAcc = LoanAcc.findOne(loanAccId);
                    let clientDoc = Client.findOne({_id: loanAcc.clientId});
                    let dataForAccount = {};

                    dataForAccount.journalDate = opts.paymentWriteOff[opts.paymentWriteOff.length - 1].rePaidDate;
                    dataForAccount.branchId = loanAcc.branchId;
                    dataForAccount.voucherId = "";
                    dataForAccount.currencyId = loanAcc.currencyId;
                    dataForAccount.memo = "Repayment Write Off " + clientDoc.khSurname + " " + clientDoc.khGivenName;
                    dataForAccount.refId = loanAcc._id;
                    dataForAccount.refFrom = "Repayment Write Off";
                    dataForAccount.total = opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest;

                    let transaction = [];


                    let acc_badDoubtfulGeneral = MapClosing.findOne({chartAccountCompare: "Bad Doubtful General"});
                    let acc_principal = checkPrincipal(loanAcc);
                    let acc_interest = checkInterest(loanAcc);


                    transaction.push({
                        account: acc_badDoubtfulGeneral.accountDoc.code + " | " + acc_badDoubtfulGeneral.accountDoc.name,
                        dr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest,
                        cr: 0,
                        drcr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount + opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest

                    }, {
                        account: acc_principal.accountDoc.code + " | " + acc_principal.accountDoc.name,
                        dr: 0,
                        cr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount,
                        drcr: -opts.paymentWriteOff[opts.paymentWriteOff.length - 1].amount
                    }, {
                        account: acc_interest.accountDoc.code + " | " + acc_interest.accountDoc.name,
                        dr: 0,
                        cr: opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest,
                        drcr: -opts.paymentWriteOff[opts.paymentWriteOff.length - 1].interest
                    });


                    dataForAccount.transaction = transaction;
                    Meteor.call("api_journalInsert", dataForAccount, function (err, result) {
                        if (err) {
                            console.log(err.message);
                        }
                    })
                }
            }

            return LoanAcc.direct.update({_id: loanAccId}, {
                $set: opts
            });

        }
    }
});


let checkPrincipal = function (doc, loanType) {

    let acc_principal = {}

    if (doc.paymentMethod == "D") {
        if (doc.term <= 365) {

            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
            }


        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
            }
        }

    } else if (doc.paymentMethod == "W") {
        if (doc.term <= 52) {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
            }
        }
    } else if (doc.paymentMethod == "M") {
        if (doc.term <= 12) {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Less than or Equal One Year"});
            }
        } else {
            if (doc.accountType == "IL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
            }
        }
    } else {
        if (doc.accountType == "IL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Individual Over One Year"});
        } else if (doc.accountType == "GL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Group Over One Year"});

        } else if (doc.accountType == "EL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Enterprise Over One Year"});

        } else if (doc.accountType == "OL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Other Over One Year"});

        } else if (doc.accountType == "RPAL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party External Auditors Over One Year"});

        } else if (doc.accountType == "RPSL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Shareholder Over One Year"});

        } else if (doc.accountType == "RPML") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Manager Over One Year"});

        } else if (doc.accountType == "RPEL") {
            acc_principal = MapClosing.findOne({chartAccountCompare: "Loss Loan Related Party Employees Over One Year"});
        }
    }

    return acc_principal;
}


let checkInterest = function (doc, loanType) {
    let acc_interest = {}

    if (doc.paymentMethod == "D") {
        if (doc.term <= 365) {

            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
            }


        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
            }
        }

    } else if (doc.paymentMethod == "W") {
        if (doc.term <= 52) {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
            }
        }
    } else if (doc.paymentMethod == "M") {
        if (doc.term <= 12) {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Less than or Equal One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Less than or Equal One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Less than or Equal One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Less than or Equal One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"});
            }
        } else {
            if (doc.accountType == "IL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
            } else if (doc.accountType == "GL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

            } else if (doc.accountType == "EL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

            } else if (doc.accountType == "OL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

            } else if (doc.accountType == "RPAL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

            } else if (doc.accountType == "RPSL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

            } else if (doc.accountType == "RPML") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

            } else if (doc.accountType == "RPEL") {
                acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
            }
        }
    } else {
        if (doc.accountType == "IL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Individual Over One Year"});
        } else if (doc.accountType == "GL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Group Over One Year"});

        } else if (doc.accountType == "EL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Enterprise Over One Year"});

        } else if (doc.accountType == "OL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Other Over One Year"});

        } else if (doc.accountType == "RPAL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party External Auditors Over One Year"});

        } else if (doc.accountType == "RPSL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Shareholder Over One Year"});

        } else if (doc.accountType == "RPML") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Manager Over One Year"});

        } else if (doc.accountType == "RPEL") {
            acc_interest = MapClosing.findOne({chartAccountCompare: "Interest Income Loss Loan Related Party Employees Over One Year"});
        }
    }


    return acc_interest;
}

