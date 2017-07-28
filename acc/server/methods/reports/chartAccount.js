import {ChartAccount} from "../../../imports/api/collections/chartAccount"
import {SpaceChar} from '../../../common/configs/space';

Meteor.methods({
    acc_chartAccountReport(){
        let data = {};

        let chartAccountList = ChartAccount.aggregate([
            {
                $lookup: {
                    from: "accAccountType",
                    localField: "accountTypeId",
                    foreignField: "_id",
                    as: "accountTypeDoc"
                }

            },
            {$unwind: {path: "$accountTypeDoc", preserveNullAndEmptyArrays: true}},
            {$sort: {code: 1}}
        ])

        let content = `<table class="report-content">
            <thead class="report-content-header">
            <tr>
            <th>No</th>
            <th>Name</th>
            <th>Account Type</th>
            </tr>
            </thead>
            <tbody class="report-content-body">`

        let i = 1;
        chartAccountList.forEach(function (obj) {
            content += `<tr>
                            <td>${i}</td>
                            <td>${Spacebars.SafeString(SpaceChar.space(obj.level * 12) + obj.code) + " | " + obj.name}</td>
                            <td>${obj.accountTypeDoc.name}</td>
                    </tr>`;
            i++;
        })


        content += `</tbody>
                    </table>          
                `

        data.content = content;

        return data.content;

    }
})