import {MapClosing} from '../../../acc/imports/api/collections/mapCLosing';
export default class ClassCompareAccount {
    static checkPrincipal(doc, loanType) {

        let acc_principal = {}
        if (loanType == "001" || loanType == "005" || loanType == "Reschedule") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Standard");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Standard");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Standard");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Standard");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Standard");
                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Standard");
                }
            } else {
                acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Standard");
            }
        } else if (loanType == "002" || loanType == "006") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Substandard");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Substandard");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Substandard");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Substandard");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Substandard");
                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Substandard");
                }
            } else {
                acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Substandard");
            }
        } else if (loanType == "003" || loanType == "007") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Doubtful");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Doubtful");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Doubtful");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Doubtful");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Doubtful");
                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Doubtful");
                }
            } else {
                acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Doubtful");
            }
        } else if (loanType == "004" || loanType == "008" || loanType == "Loss") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Loss");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Loss");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Loss");

                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Loss");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Less", doc.accountType, "Loss");
                } else {
                    acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Loss");
                }
            } else {
                acc_principal = ClassCompareAccount.checkChartAccountCompare("Over", doc.accountType, "Loss");
            }
        }

        return acc_principal;
    }

    static checkInterest(doc, loanType) {

        let acc_interest = {}
        if (loanType == "001" || loanType == "005" || loanType == "Reschedule") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Standard");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Standard");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Standard");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Standard");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Standard");
                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Standard");
                }
            } else {
                acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Standard");
            }
        } else if (loanType == "002" || loanType == "006") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Substandard");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Substandard");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Substandard");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Substandard");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Substandard");
                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Substandard");
                }
            } else {
                acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Substandard");
            }
        } else if (loanType == "003" || loanType == "007") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Doubtful");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Doubtful");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Doubtful");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Doubtful");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Doubtful");
                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Doubtful");
                }
            } else {
                acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Doubtful");
            }
        } else if (loanType == "004" || loanType == "008" || loanType == "Loss") {
            if (doc.paymentMethod == "D") {
                if (doc.term <= 365) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Loss");

                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Loss");
                }

            } else if (doc.paymentMethod == "W") {
                if (doc.term <= 52) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Loss");
                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Loss");
                }
            } else if (doc.paymentMethod == "M") {
                if (doc.term <= 12) {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Less", doc.accountType, "Loss");
                } else {
                    acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Loss");
                }
            } else {
                acc_interest = ClassCompareAccount.checkChartAccountCompareInterest("Over", doc.accountType, "Loss");
            }
        }
        console.log(acc_interest);

        return acc_interest;
    }

    static checkChartAccountCompare(lessOrOver, prop, loanType) {
        let type = {
            Less: {
                IL: {
                    Standard: "Standard Loan Individual Less than or Equal One Year",
                    Substandard: "Substandard Loan Individual Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Individual Less than or Equal One Year",
                    Loss: "Loss Loan Individual Less than or Equal One Year"
                },
                GL: {
                    Standard: "Standard Loan Group Less than or Equal One Year",
                    Substandard: "Substandard Loan Group Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Group Less than or Equal One Year",
                    Loss: "Loss Loan Group Less than or Equal One Year"
                },
                EL: {
                    Standard: "Standard Loan Enterprise Less than or Equal One Year",
                    Substandard: "Substandard Loan Enterprise Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Enterprise Less than or Equal One Year",
                    Loss: "Loss Loan Enterprise Less than or Equal One Year"
                },
                OL: {
                    Standard: "Standard Loan Other Less than or Equal One Year",
                    Substandard: "Substandard Loan Other Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Other Less than or Equal One Year",
                    Loss: "Loss Loan Other Less than or Equal One Year"
                },
                RPAL: {
                    Standard: "Standard Loan Related Party External Auditors Less than or Equal One Year",
                    Substandard: "Substandard Loan Related Party External Auditors Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Related Party External Auditors Less than or Equal One Year",
                    Loss: "Loss Loan Related Party External Auditors Less than or Equal One Year"
                },
                RSPL: {
                    Standard: "Standard Loan Related Party Shareholder Less than or Equal One Year",
                    Substandard: "Substandard Loan Related Party Shareholder Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Related Party Shareholder Less than or Equal One Year",
                    Loss: "Loss Loan Related Party Shareholder Less than or Equal One Year"
                },
                RPML: {
                    Standard: "Standard Loan Related Party Manager Less than or Equal One Year",
                    Substandard: "Substandard Loan Related Party Manager Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Related Party Manager Less than or Equal One Year",
                    Loss: "Loss Loan Related Party Manager Less than or Equal One Year"
                },
                RPEL: {
                    Standard: "Standard Loan Related Party Employees Less than or Equal One Year",
                    Substandard: "Substandard Loan Related Party Employees Less than or Equal One Year",
                    Doubtful: "Doubtful Loan Related Party Employees Less than or Equal One Year",
                    Loss: "Loss Loan Related Party Employees Less than or Equal One Year"
                }
            },
            Over: {
                IL: {
                    Standard: "Standard Loan Individual Over One Year",
                    Substandard: "Substandard Loan Individual Over One Year",
                    Doubtful: "Doubtful Loan Individual Over One Year",
                    Loss: "Loss Loan Individual Over One Year"
                },
                GL: {
                    Standard: "Standard Loan Group Over One Year",
                    Substandard: "Substandard Loan Group Over One Year",
                    Doubtful: "Doubtful Loan Group Over One Year",
                    Loss: "Loss Loan Group Over One Year"
                },
                EL: {
                    Standard: "Standard Loan Enterprise Over One Year",
                    Substandard: "Substandard Loan Enterprise Over One Year",
                    Doubtful: "Doubtful Loan Enterprise Over One Year",
                    Loss: "Loss Loan Enterprise Over One Year"
                },
                OL: {
                    Standard: "Standard Loan Other Over One Year",
                    Substandard: "Substandard Loan Other Over One Year",
                    Doubtful: "Doubtful Loan Other Over One Year",
                    Loss: "Loss Loan Other Over One Year"
                },
                RPAL: {
                    Standard: "Standard Loan Related Party External Auditors Over One Year",
                    Substandard: "Substandard Loan Related Party External Auditors Over One Year",
                    Doubtful: "Doubtful Loan Related Party External Auditors Over One Year",
                    Loss: "Loss Loan Related Party External Auditors Over One Year"
                },
                RSPL: {
                    Standard: "Standard Loan Related Party Shareholder Over One Year",
                    Substandard: "Substandard Loan Related Party Shareholder Over One Year",
                    Doubtful: "Doubtful Loan Related Party Shareholder Over One Year",
                    Loss: "Loss Loan Related Party Shareholder Over One Year"
                },
                RPML: {
                    Standard: "Standard Loan Related Party Manager Over One Year",
                    Substandard: "Substandard Loan Related Party Manager Over One Year",
                    Doubtful: "Doubtful Loan Related Party Manager Over One Year",
                    Loss: "Loss Loan Related Party Manager Over One Year"
                },
                RPEL: {
                    Standard: "Standard Loan Related Party Employees Over One Year",
                    Substandard: "Substandard Loan Related Party Employees Over One Year",
                    Doubtful: "Doubtful Loan Related Party Employees Over One Year",
                    Loss: "Loss Loan Related Party Employees Over One Year"
                }
            }
        };

        return MapClosing.findOne({chartAccountCompare: type[lessOrOver][prop][loanType]});
    }

    static checkChartAccountCompareInterest(lessOrOver, prop, loanType) {
        let type = {
            Less: {
                IL: {
                    Standard: "Interest Income Standard Loan Individual Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Individual Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Individual Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Individual Less than or Equal One Year"
                },
                GL: {
                    Standard: "Interest Income Standard Loan Group Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Group Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Group Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Group Less than or Equal One Year"
                },
                EL: {
                    Standard: "Interest Income Standard Loan Enterprise Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Enterprise Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Enterprise Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Enterprise Less than or Equal One Year"
                },
                OL: {
                    Standard: "Interest Income Standard Loan Other Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Other Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Other Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Other Less than or Equal One Year"
                },
                RPAL: {
                    Standard: "Interest Income Standard Loan Related Party External Auditors Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Related Party External Auditors Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party External Auditors Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"
                },
                RSPL: {
                    Standard: "Interest Income Standard Loan Related Party Shareholder Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Shareholder Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Shareholder Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"
                },
                RPML: {
                    Standard: "Interest Income Standard Loan Related Party Manager Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Manager Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Manager Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"
                },
                RPEL: {
                    Standard: "Interest Income Standard Loan Related Party Employees Less than or Equal One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Employees Less than or Equal One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Employees Less than or Equal One Year",
                    Loss: "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"
                }
            },
            Over: {
                IL: {
                    Standard: "Interest Income Standard Loan Individual Over One Year",
                    Substandard: "Interest Income Substandard Loan Individual Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Individual Over One Year",
                    Loss: "Interest Income Loss Loan Individual Over One Year"
                },
                GL: {
                    Standard: "Interest Income Standard Loan Group Over One Year",
                    Substandard: "Interest Income Substandard Loan Group Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Group Over One Year",
                    Loss: "Interest Income Loss Loan Group Over One Year"
                },
                EL: {
                    Standard: "Interest Income Standard Loan Enterprise Over One Year",
                    Substandard: "Interest Income Substandard Loan Enterprise Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Enterprise Over One Year",
                    Loss: "Interest Income Loss Loan Enterprise Over One Year"
                },
                OL: {
                    Standard: "Interest Income Standard Loan Other Over One Year",
                    Substandard: "Interest Income Substandard Loan Other Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Other Over One Year",
                    Loss: "Interest Income Loss Loan Other Over One Year"
                },
                RPAL: {
                    Standard: "Interest Income Standard Loan Related Party External Auditors Over One Year",
                    Substandard: "Interest Income Substandard Loan Related Party External Auditors Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party External Auditors Over One Year",
                    Loss: "Interest Income Loss Loan Related Party External Auditors Over One Year"
                },
                RSPL: {
                    Standard: "Interest Income Standard Loan Related Party Shareholder Over One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Shareholder Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Shareholder Over One Year",
                    Loss: "Interest Income Loss Loan Related Party Shareholder Over One Year"
                },
                RPML: {
                    Standard: "Interest Income Standard Loan Related Party Manager Over One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Manager Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Manager Over One Year",
                    Loss: "Interest Income Loss Loan Related Party Manager Over One Year"
                },
                RPEL: {
                    Standard: "Interest Income Standard Loan Related Party Employees Over One Year",
                    Substandard: "Interest Income Substandard Loan Related Party Employees Over One Year",
                    Doubtful: "Interest Income Doubtful Loan Related Party Employees Over One Year",
                    Loss: "Interest Income Loss Loan Related Party Employees Over One Year"
                }
            }

        };
        return MapClosing.findOne({chartAccountCompare: type[lessOrOver][prop][loanType]});
    }
}


