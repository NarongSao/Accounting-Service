import {Meteor} from 'meteor/meteor';
import {_} from 'meteor/erasaur:meteor-lodash';

import {MapClosing} from '../../imports/api/collections/mapCLosing';
Meteor.startup(function () {
    if (MapClosing.find().count() == 0) {


        let data = [

            //Data for closing
            {
                "_id": "001",
                "chartAccountCompare": "Equivalance Exchange Account"
            },
            {
                "_id": "002",
                "chartAccountCompare": "Foreign Exchange Gain"
            },
            {
                "_id": "003",
                "chartAccountCompare": "Loss on Foreign Exchange"
            },
            {
                "_id": "004",
                "chartAccountCompare": "Retain Earning"
            },


            //Data for Integrate
            //Normal
            {
                "_id": "005",
                "chartAccountCompare": "Cash"
            }, {
                "_id": "006",
                "chartAccountCompare": "Unearn Income"
            }, {
                "_id": "007",
                "chartAccountCompare": "Penalty"
            }, {
                "_id": "008",
                "chartAccountCompare": "Fee On Operation"
            }, {
                "_id": "009",
                "chartAccountCompare": "Fee On Disbursement"
            }, {
                "_id": "010",
                "chartAccountCompare": "Bad Doubtful General"
            }, {
                "_id": "011",
                "chartAccountCompare": "Bad Doubtful Specific"
            }, {
                "_id": "140",
                "chartAccountCompare": "Interest Waived"
            }, {
                "_id": "141",
                "chartAccountCompare": "Other Interest Income"
            }, {
                "_id": "142",
                "chartAccountCompare": "Waived For Death"
            }

            //Standard
            , {
                "_id": "012",
                "chartAccountCompare": "Standard Loan Group Less than or Equal One Year"
            }, {
                "_id": "013",
                "chartAccountCompare": "Standard Loan Individual Less than or Equal One Year"
            }, {
                "_id": "014",
                "chartAccountCompare": "Standard Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "015",
                "chartAccountCompare": "Standard Loan Other Less than or Equal One Year"
            }, {
                "_id": "016",
                "chartAccountCompare": "Standard Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "017",
                "chartAccountCompare": "Standard Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "018",
                "chartAccountCompare": "Standard Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "019",
                "chartAccountCompare": "Standard Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "020",
                "chartAccountCompare": "Standard Loan Group Over One Year"
            }, {
                "_id": "021",
                "chartAccountCompare": "Standard Loan Individual Over One Year"
            }, {
                "_id": "022",
                "chartAccountCompare": "Standard Loan Enterprise Over One Year"
            }, {
                "_id": "023",
                "chartAccountCompare": "Standard Loan Other Over One Year"
            }, {
                "_id": "024",
                "chartAccountCompare": "Standard Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "025",
                "chartAccountCompare": "Standard Loan Related Party Manager Over One Year"
            }, {
                "_id": "026",
                "chartAccountCompare": "Standard Loan Related Party Employees Over One Year"
            }, {
                "_id": "027",
                "chartAccountCompare": "Standard Loan Related Party External Auditors Over One Year"
            }


            //Substandard
            , {
                "_id": "028",
                "chartAccountCompare": "Substandard Loan Group Less than or Equal One Year"
            }, {
                "_id": "029",
                "chartAccountCompare": "Substandard Loan Individual Less than or Equal One Year"
            }, {
                "_id": "030",
                "chartAccountCompare": "Substandard Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "031",
                "chartAccountCompare": "Substandard Loan Other Less than or Equal One Year"
            }, {
                "_id": "032",
                "chartAccountCompare": "Substandard Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "033",
                "chartAccountCompare": "Substandard Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "034",
                "chartAccountCompare": "Substandard Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "035",
                "chartAccountCompare": "Substandard Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "036",
                "chartAccountCompare": "Substandard Loan Group Over One Year"
            }, {
                "_id": "037",
                "chartAccountCompare": "Substandard Loan Individual Over One Year"
            }, {
                "_id": "038",
                "chartAccountCompare": "Substandard Loan Enterprise Over One Year"
            }, {
                "_id": "039",
                "chartAccountCompare": "Substandard Loan Other Over One Year"
            }, {
                "_id": "040",
                "chartAccountCompare": "Substandard Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "041",
                "chartAccountCompare": "Substandard Loan Related Party Manager Over One Year"
            }, {
                "_id": "042",
                "chartAccountCompare": "Substandard Loan Related Party Employees Over One Year"
            }, {
                "_id": "043",
                "chartAccountCompare": "Substandard Loan Related Party External Auditors Over One Year"
            }



            //Doubtful

            , {
                "_id": "044",
                "chartAccountCompare": "Doubtful Loan Group Less than or Equal One Year"
            }, {
                "_id": "045",
                "chartAccountCompare": "Doubtful Loan Individual Less than or Equal One Year"
            }, {
                "_id": "046",
                "chartAccountCompare": "Doubtful Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "047",
                "chartAccountCompare": "Doubtful Loan Other Less than or Equal One Year"
            }, {
                "_id": "048",
                "chartAccountCompare": "Doubtful Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "049",
                "chartAccountCompare": "Doubtful Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "050",
                "chartAccountCompare": "Doubtful Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "051",
                "chartAccountCompare": "Doubtful Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "052",
                "chartAccountCompare": "Doubtful Loan Group Over One Year"
            }, {
                "_id": "053",
                "chartAccountCompare": "Doubtful Loan Individual Over One Year"
            }, {
                "_id": "054",
                "chartAccountCompare": "Doubtful Loan Enterprise Over One Year"
            }, {
                "_id": "055",
                "chartAccountCompare": "Doubtful Loan Other Over One Year"
            }, {
                "_id": "056",
                "chartAccountCompare": "Doubtful Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "057",
                "chartAccountCompare": "Doubtful Loan Related Party Manager Over One Year"
            }, {
                "_id": "058",
                "chartAccountCompare": "Doubtful Loan Related Party Employees Over One Year"
            }, {
                "_id": "059",
                "chartAccountCompare": "Doubtful Loan Related Party External Auditors Over One Year"
            }

            //Loss

            , {
                "_id": "060",
                "chartAccountCompare": "Loss Loan Group Less than or Equal One Year"
            }, {
                "_id": "061",
                "chartAccountCompare": "Loss Loan Individual Less than or Equal One Year"
            }, {
                "_id": "062",
                "chartAccountCompare": "Loss Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "063",
                "chartAccountCompare": "Loss Loan Other Less than or Equal One Year"
            }, {
                "_id": "064",
                "chartAccountCompare": "Loss Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "065",
                "chartAccountCompare": "Loss Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "066",
                "chartAccountCompare": "Loss Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "067",
                "chartAccountCompare": "Loss Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "068",
                "chartAccountCompare": "Loss Loan Group Over One Year"
            }, {
                "_id": "069",
                "chartAccountCompare": "Loss Loan Individual Over One Year"
            }, {
                "_id": "070",
                "chartAccountCompare": "Loss Loan Enterprise Over One Year"
            }, {
                "_id": "071",
                "chartAccountCompare": "Loss Loan Other Over One Year"
            }, {
                "_id": "072",
                "chartAccountCompare": "Loss Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "073",
                "chartAccountCompare": "Loss Loan Related Party Manager Over One Year"
            }, {
                "_id": "074",
                "chartAccountCompare": "Loss Loan Related Party Employees Over One Year"
            }, {
                "_id": "075",
                "chartAccountCompare": "Loss Loan Related Party External Auditors Over One Year"
            }


            //Interest Income


            //Interest Income Standard
            , {
                "_id": "076",
                "chartAccountCompare": "Interest Income Standard Loan Group Less than or Equal One Year"
            }, {
                "_id": "077",
                "chartAccountCompare": "Interest Income Standard Loan Individual Less than or Equal One Year"
            }, {
                "_id": "078",
                "chartAccountCompare": "Interest Income Standard Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "079",
                "chartAccountCompare": "Interest Income Standard Loan Other Less than or Equal One Year"
            }, {
                "_id": "080",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "081",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "082",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "083",
                "chartAccountCompare": "Interest Income Standard Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "084",
                "chartAccountCompare": "Interest Income Standard Loan Group Over One Year"
            }, {
                "_id": "085",
                "chartAccountCompare": "Interest Income Standard Loan Individual Over One Year"
            }, {
                "_id": "086",
                "chartAccountCompare": "Interest Income Standard Loan Enterprise Over One Year"
            }, {
                "_id": "087",
                "chartAccountCompare": "Interest Income Standard Loan Other Over One Year"
            }, {
                "_id": "088",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "089",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Manager Over One Year"
            }, {
                "_id": "090",
                "chartAccountCompare": "Interest Income Standard Loan Related Party Employees Over One Year"
            }, {
                "_id": "091",
                "chartAccountCompare": "Interest Income Standard Loan Related Party External Auditors Over One Year"
            }


            //Interest Income Substandard
            , {
                "_id": "092",
                "chartAccountCompare": "Interest Income Substandard Loan Group Less than or Equal One Year"
            }, {
                "_id": "093",
                "chartAccountCompare": "Interest Income Substandard Loan Individual Less than or Equal One Year"
            }, {
                "_id": "094",
                "chartAccountCompare": "Interest Income Substandard Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "095",
                "chartAccountCompare": "Interest Income Substandard Loan Other Less than or Equal One Year"
            }, {
                "_id": "096",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "097",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "098",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "099",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "100",
                "chartAccountCompare": "Interest Income Substandard Loan Group Over One Year"
            }, {
                "_id": "101",
                "chartAccountCompare": "Interest Income Substandard Loan Individual Over One Year"
            }, {
                "_id": "102",
                "chartAccountCompare": "Interest Income Substandard Loan Enterprise Over One Year"
            }, {
                "_id": "103",
                "chartAccountCompare": "Interest Income Substandard Loan Other Over One Year"
            }, {
                "_id": "104",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "105",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Manager Over One Year"
            }, {
                "_id": "106",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party Employees Over One Year"
            }, {
                "_id": "107",
                "chartAccountCompare": "Interest Income Substandard Loan Related Party External Auditors Over One Year"
            }



            //Interest Income Doubtful

            , {
                "_id": "108",
                "chartAccountCompare": "Interest Income Doubtful Loan Group Less than or Equal One Year"
            }, {
                "_id": "109",
                "chartAccountCompare": "Interest Income Doubtful Loan Individual Less than or Equal One Year"
            }, {
                "_id": "110",
                "chartAccountCompare": "Interest Income Doubtful Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "111",
                "chartAccountCompare": "Interest Income Doubtful Loan Other Less than or Equal One Year"
            }, {
                "_id": "112",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "113",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "114",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "115",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "116",
                "chartAccountCompare": "Interest Income Doubtful Loan Group Over One Year"
            }, {
                "_id": "117",
                "chartAccountCompare": "Interest Income Doubtful Loan Individual Over One Year"
            }, {
                "_id": "118",
                "chartAccountCompare": "Interest Income Doubtful Loan Enterprise Over One Year"
            }, {
                "_id": "119",
                "chartAccountCompare": "Interest Income Doubtful Loan Other Over One Year"
            }, {
                "_id": "120",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "121",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Manager Over One Year"
            }, {
                "_id": "122",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party Employees Over One Year"
            }, {
                "_id": "123",
                "chartAccountCompare": "Interest Income Doubtful Loan Related Party External Auditors Over One Year"
            }

            //Interest Income Loss

            , {
                "_id": "124",
                "chartAccountCompare": "Interest Income Loss Loan Group Less than or Equal One Year"
            }, {
                "_id": "125",
                "chartAccountCompare": "Interest Income Loss Loan Individual Less than or Equal One Year"
            }, {
                "_id": "126",
                "chartAccountCompare": "Interest Income Loss Loan Enterprise Less than or Equal One Year"
            }, {
                "_id": "127",
                "chartAccountCompare": "Interest Income Loss Loan Other Less than or Equal One Year"
            }, {
                "_id": "128",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Shareholder Less than or Equal One Year"
            }, {
                "_id": "129",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Manager Less than or Equal One Year"
            }, {
                "_id": "130",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Employees Less than or Equal One Year"
            }, {
                "_id": "131",
                "chartAccountCompare": "Interest Income Loss Loan Related Party External Auditors Less than or Equal One Year"
            }


            , {
                "_id": "132",
                "chartAccountCompare": "Interest Income Loss Loan Group Over One Year"
            }, {
                "_id": "133",
                "chartAccountCompare": "Interest Income Loss Loan Individual Over One Year"
            }, {
                "_id": "134",
                "chartAccountCompare": "Interest Income Loss Loan Enterprise Over One Year"
            }, {
                "_id": "135",
                "chartAccountCompare": "Interest Income Loss Loan Other Over One Year"
            }, {
                "_id": "136",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Shareholder Over One Year"
            }, {
                "_id": "137",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Manager Over One Year"
            }, {
                "_id": "138",
                "chartAccountCompare": "Interest Income Loss Loan Related Party Employees Over One Year"
            }, {
                "_id": "139",
                "chartAccountCompare": "Interest Income Loss Loan Related Party External Auditors Over One Year"
            }


        ];

        _.forEach(data, (val) => {
            MapClosing.insert(val);
        });


        /// Migrate
        /*MapClosing.insert({
         chartAccountCompare: 'Account Receivable',
         });
         MapClosing.insert({
         chartAccountCompare: 'Account Payable',
         });
         MapClosing.insert({
         chartAccountCompare: 'Cash On Hand',
         });
         MapClosing.insert({
         chartAccountCompare: 'Purchase Discount',
         });
         MapClosing.insert({
         chartAccountCompare: 'Borrow',
         });
         MapClosing.insert({
         chartAccountCompare: 'Account Receivable (SO)',
         });
         MapClosing.insert({
         chartAccountCompare: 'Account Payable (SO)',
         });
         MapClosing.insert({
         chartAccountCompare: 'Own Inventory (SO)',
         });
         MapClosing.insert({
         chartAccountCompare: 'Company Owe Inventory (SO)',
         });
         MapClosing.insert({
         chartAccountCompare: 'Owe Inventory',
         });
         MapClosing.insert({
         chartAccountCompare: 'Transport Revenue',
         });
         MapClosing.insert({
         chartAccountCompare: 'Transport Expense',
         });*/


    }
});
