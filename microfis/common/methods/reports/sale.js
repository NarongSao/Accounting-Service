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
import {Category} from '../../../common/collections/category';
import {GroupCategory} from '../../../common/collections/groupCategory';
import {Vendor} from '../../../common/collections/vendor';
import {Purchase} from '../../../common/collections/purchase';
import {Sale} from '../../../common/collections/sale';


// Method
import  {lookupLoanAcc} from '../lookup-loan-acc.js';
import  {checkRepaymentRealTime} from '../check-repayment.js';

export const saleReport = new ValidatedMethod({
    name: 'microfis.saleReport',
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
            let fDate = moment(date[0], 'DD/MM/YYYY').startOf("days").toDate();
            let tDate = moment(date[1], 'DD/MM/YYYY').endOf("days").toDate();


            let exchangeData = Exchange.findOne({_id: params.exchangeId});

            let header = {};

            header.branchId = "All";

            header.date = moment(fDate).format("DD/MM/YYYY") + " - " + moment(tDate).format("DD/MM/YYYY");
            header.vendorId = "All";
            header.categoryId = "All";

            header.groupId = "All";


            /****** Content *****/


            let baseCurrency = Setting.findOne().baseCurrency;

            let content = "";
            content += `<table class="sub-table table table-striped  table-hover diplay-on-print-table-loan">
                            <thead class="sub-header diplay-on-print-header-loan">
                                <tr> 
                                    <th>No</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Group</th>
                                    <th>Sale Date</th>
                                    <th>Price</th>
                                    <th>Paid</th>
                                   
                                </tr>
                            </thead>
                            <tbody class="sub-body display-on-print-body-loan">`;


            //Param
            let selector = {};
            let selectorSale = {};



            if (params.branchId && params.branchId.includes("All") == false) {
                selectorSale.branchId = {$in: params.branchId};
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

            if (params.categoryId && params.categoryId.includes("All") == false) {
                selector["purchaseDoc.categoryId"] = {$in: params.categoryId};
                let categoryList = Category.find({_id: {$in: params.categoryId}}, {
                    fields: {
                        _id: 1
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.categoryId = categoryList;

            }

            if (params.transactionType && params.transactionType.includes("All") == false) {
                selector["purchaseDoc.transactionType"]= {$in: params.transactionType};
            }
            if (params.groupId && params.groupId.includes("All") == false) {
                selector["purchaseDoc.groupId"] = {$in: params.groupId};
                let groupList = GroupCategory.find({_id: {$in: params.groupId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.groupId = groupList;
            }


            if (params.vendorId && params.vendorId.includes("All") == false) {
                selector["purchaseDoc.vendorId"] = {$in: params.vendorId};
                let vendorList = Vendor.find({_id: {$in: params.vendorId}}, {
                    fields: {
                        name: 1,
                        _id: 0
                    }
                }).fetch().map(function (obj) {
                    return obj.name;
                });
                header.vendorId = vendorList;
            }

            selectorSale.saleDate={$gte: moment(date[0]).startOf("day").toDate(), $lte: moment(date[1]).endOf("day").toDate()}


            data.header = header;
            let i=1;
            let saleList=Sale.aggregate([
                {$match: selectorSale},
                {
                    $lookup: {
                        from: "microfis_purchase",
                        localField: "purchaseId",
                        foreignField: "_id",
                        as: "purchaseDoc"
                    }
                },
                {$unwind: {path: "$purchaseDoc", preserveNullAndEmptyArrays: true}},
                {$match: selector},
                {
                    $lookup: {
                        from: "microfis_category",
                        localField: "purchaseDoc.category",
                        foreignField: "_id",
                        as: "categoryDoc"
                    }
                },
                {$unwind: {path: "$categoryDoc", preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "microfis_groupCategory",
                        localField: "purchaseDoc.group",
                        foreignField: "_id",
                        as: "groupDoc"
                    }
                },
                {$unwind: {path: "$groupDoc", preserveNullAndEmptyArrays: true}},

            ]);
            let totalPrice=0;
            let totalPaid=0;
            saleList.forEach(function (result) {
                content+=`<tr>
                                <td>${i}</td>
                                <td>${result.purchaseDoc.itemName}</td>
                                <td>${result.categoryDoc.name}</td>
                                <td>${result.groupDoc.name}</td>
                                <td>${moment(result.saleDate).format("DD/MM/YYYY")}</td>
                                <td style="text-align: right">${numeral(result.price).format("(0,00.00)")}</td>
                                <td style="text-align: right">${numeral(result.paid).format("(0,00.00)")}</td>
                              
                </tr>`
                i++;

                totalPaid+=result.paid;
                totalPrice+=result.price;
            })


           content+=`<tr>
                            <th colspan="5" style="text-align: right">Total :</th>
                            <td style="text-align: right">${numeral(totalPrice).format("(0,00.00)")}</td>
                            <td style="text-align: right">${numeral(totalPaid).format("(0,00.00)")}</td>
                 
                    </tr>`
            data.content = content;
            return data
        }
    }
});

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

