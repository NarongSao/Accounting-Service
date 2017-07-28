// import {Meteor} from 'meteor/meteor';
// import {check} from 'meteor/check';
// import {ValidatedMethod} from 'meteor/mdg:validated-method';
// import {SimpleSchema} from 'meteor/aldeed:simple-schema';
// import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
// import {_} from 'meteor/erasaur:meteor-lodash';
// import moment from 'moment';
// import math from 'mathjs';
//
// // Lib
// import {roundCurrency} from '../../imports/api/libs/round-currency.js';
//
// // Method
// import {Calculate} from './libs/calculate.js';
//
// export let MakeSchedule = {};
//
// MakeSchedule.declinig = new ValidatedMethod({
//     name: 'microfis.makeSchedule.declining',
//     mixins: [CallPromiseMixin],
//     validate: new SimpleSchema({
//         disbursementDate: {
//             type: Date
//         },
//         currencyId: {
//             type: String,
//             allowedValues: ['KHR', 'USD', 'THB']
//         },
//         microfisAmount: {
//             type: Number,
//             decimal: true
//         },
//         paymentMethod: {
//             type: String, // Daily, Weekly, Monthly and Yearly
//             allowedValues: ['D', 'W', 'M', 'Y']
//         },
//         repaidFrequency: {
//             type: Number, // 1 month, 2 months, ... depend on Payment Method
//             min: 1
//         },
//         term: {
//             type: Number, // Num of payment
//             min: 1
//         },
//         firstRepaymentDate: {
//             type: Date,
//             optional: true
//         },
//         dueDateOn: {
//             type: Number // W: 1-7, M: 1-25
//         },
//         principalInstallment: {
//             type: Object
//         },
//         'principalInstallment.frequency': {
//             type: Number,
//             min: 1
//         },
//         'principalInstallment.calculateType': {
//             type: String,
//             allowedValues: ['A', 'P']
//         },
//         'principalInstallment.amount': {
//             type: Number,
//             decimal: true
//         },
//         interestRate: {
//             type: Number,
//             decimal: true
//         },
//         escapeDayMethod: {
//             type: String
//         },
//         escapeDayFrequency: {
//             type: Number
//         },
//         dayOfWeekToEscape: {
//             type: [Number],
//             optional: true
//         },
//         dateOfMonthToEscape: {
//             type: [Object], // [{from: '2016-01-01', to: '2016-01-01'}, {from: '2016-04-13', to: '2016-04-16'}]
//             optional: true,
//             blackbox: true
//         }
//     }).validator(),
//     run(opts) {
//         if (!this.isSimulation) {
//             Meteor._sleepForMs(200);
//
//             // Declare default value
//             let schedules = [];
//             let principalInstallmentAmountPerLine = opts.principalInstallment.amount;
//
//             // Check principal installment calculate type
//             if (opts.principalInstallment.calculateType == 'P') {
//                 let numOfPrincipalInstallmentFrequency = _.ceil(opts.term / opts.principalInstallment.frequency);
//                 principalInstallmentAmountPerLine = (opts.microfisAmount / numOfPrincipalInstallmentFrequency) * (opts.principalInstallment.amount / 100);
//                 principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, opts.currencyId);
//             }
//
//             // Config moment addingTime for next due date
//             let addingTime;
//             switch (opts.paymentMethod) {
//                 case 'D': // Daily
//                     addingTime = 'd';
//                     break;
//                 case 'W': // Weekly
//                     addingTime = 'w';
//                     break;
//                 case 'M': // Monthly
//                     addingTime = 'M';
//                     break;
//                 case 'Y': // Yearly
//                     addingTime = 'y';
//                     break;
//             }
//
//             // Schedule for first line
//             schedules.push({
//                 installment: 0,
//                 dueDate: opts.disbursementDate,
//                 numOfDay: 0,
//                 principalDue: 0,
//                 interestDue: 0,
//                 totalDue: 0,
//                 balance: opts.microfisAmount
//             });
//
//             // Schedule loop
//             for (let i = 1; i <= opts.term; i++) {
//                 let previousLine, dueDate, numOfDay, principalDue = 0, interestDue, totalDue;
//
//                 previousLine = schedules[i - 1];
//
//                 dueDate = findDueDate({
//                     installment: i,
//                     disbursementDate: opts.disbursementDate,
//                     previousDate: previousLine.dueDate,
//                     repaidFrequency: opts.repaidFrequency,
//                     addingTime: addingTime,
//                     escapeDayMethod: opts.escapeDayMethod, // [6, 0]
//                     escapeDayFrequency: opts.escapeDayFrequency, // 1,2,3 ... times
//                     dayOfWeekToEscape: opts.dayOfWeekToEscape, // [6, 0]
//                     dateOfMonthToEscape: opts.dateOfMonthToEscape,
//                     paymentMethod: opts.paymentMethod,
//                     dueDateOn: opts.dueDateOn
//                 });
//
//                 // Check first repayment date
//                 if (i == 1 && opts.firstRepaymentDate) {
//                     dueDate = opts.firstRepaymentDate;
//                 }
//                 numOfDay = moment(dueDate).diff(previousLine.dueDate, 'days');
//
//                 // Check principal due per line
//                 if (i % opts.principalInstallment.frequency == 0) {
//                     principalDue = principalInstallmentAmountPerLine;
//                 }
//
//                 // Check principal due for last line
//                 if (i == opts.term) {
//                     principalDue = previousLine.balance;
//                 }
//
//                 interestDue = Calculate.interest.call({
//                     amount: previousLine.balance,
//                     numOfDay: numOfDay,
//                     interestRate: opts.interestRate,
//                     method: opts.paymentMethod,
//                     currencyId: opts.currencyId
//                 });
//                 totalDue = roundCurrency(principalDue + interestDue, opts.currencyId);
//                 balane = roundCurrency(previousLine.balance - principalDue, opts.currencyId);
//
//                 schedules.push({
//                     installment: i,
//                     dueDate: dueDate,
//                     numOfDay: numOfDay,
//                     principalDue: principalDue,
//                     interestDue: interestDue,
//                     totalDue: totalDue,
//                     balance: balane
//                 });
//             }
//
//             return schedules;
//         }
//     }
// });
//
// // Functions
// function findDueDate(opts) {
//     new SimpleSchema({
//         installment: {
//             type: Number
//         },
//         disbursementDate: {
//             type: Date
//         },
//         previousDate: {
//             type: Date
//         },
//         repaidFrequency: {
//             type: Number
//         },
//         addingTime: {
//             type: String
//         },
//         escapeDayMethod: {
//             type: String
//         },
//         escapeDayFrequency: {
//             type: Number
//         },
//         dayOfWeekToEscape: {
//             type: [Number] // [6,7]
//         },
//         dateOfMonthToEscape: {
//             type: [Object], // [6,7]
//             blackbox: true
//         },
//         paymentMethod: {
//             type: String
//         },
//         dueDateOn: {
//             type: Number
//         }
//     }).validate(opts);
//
//     // let dueDate = moment(opts.previousDate).add(opts.repaidFrequency, opts.addingTime).toDate();
//     let dueDate = moment(opts.disbursementDate).add(opts.repaidFrequency * opts.installment, opts.addingTime).toDate();
//
//     // Check due date on
//     if (opts.paymentMethod == 'W') {
//         dueDate = moment(dueDate).isoWeekday(opts.dueDateOn).toDate();
//     } else if (opts.paymentMethod == 'M' || opts.paymentMethod == 'Y') {
//         dueDate = moment(dueDate).date(opts.dueDateOn).toDate();
//     }
//
//     // Check day escape
//     if (opts.escapeDayMethod == 'PN') { // Previous & Next
//         let escapeDay = isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.dateOfMonthToEscape);
//         if (escapeDay) {
//             let getDoEscapeDay;
//
//             // Check previous escape
//             getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
//                 escapeDayFrequency: -opts.escapeDayFrequency,
//                 dayOfWeekToEscape: opts.dayOfWeekToEscape,
//                 dateOfMonthToEscape: opts.dateOfMonthToEscape
//             });
//
//             // Check next escape
//             if (moment(opts.previousDate).isBefore(getDoEscapeDay)) {
//                 getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
//                     escapeDayFrequency: opts.escapeDayFrequency,
//                     dayOfWeekToEscape: opts.dayOfWeekToEscape,
//                     dateOfMonthToEscape: opts.dateOfMonthToEscape
//                 });
//             }
//
//             return getDoEscapeDay;
//         }
//     } else if (opts.escapeDayMethod == 'AN') { // Always Next
//         let escapeDay = isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.dateOfMonthToEscape);
//         if (escapeDay) {
//             let getDoEscapeDay;
//
//             // Check always next
//             getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
//                 escapeDayFrequency: opts.escapeDayFrequency,
//                 dayOfWeekToEscape: opts.dayOfWeekToEscape,
//                 dateOfMonthToEscape: opts.dateOfMonthToEscape
//             });
//
//             return getDoEscapeDay;
//         }
//     }
//
//     return dueDate;
// }
//
// function doEscapeDayWithFrequency(date, opts) {
//     check(date, Date);
//
//     new SimpleSchema({
//         escapeDayFrequency: {type: Number},
//         dayOfWeekToEscape: {type: [Number]},
//         dateOfMonthToEscape: {type: [Object], blackbox: true}
//     }).validate(opts);
//
//     let tmpEscapeDay, tmpDate = date;
//
//     do {
//         tmpDate = moment(tmpDate).add(opts.escapeDayFrequency, 'd').toDate();
//         tmpEscapeDay = isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.dateOfMonthToEscape);
//     } while (tmpEscapeDay);
//
//     return tmpDate;
// }
//
// function isInEscapeDayAndDate(date, dayOfWeekToEscape, dateOfMonthToEscape) {
//     check(date, Date);
//     check(dayOfWeekToEscape, [Number]);
//     check(dateOfMonthToEscape, [Object]);
//
//     // Check date of month
//     let checkDayOfWeek = _.includes(dayOfWeekToEscape, moment(date).isoWeekday());
//     let checkDateOfMonth = _.find(dateOfMonthToEscape, (o)=> {
//         return moment(date).isBetween(o.from, o.to, 'day', '[]');
//     });
//
//     if (checkDayOfWeek || checkDateOfMonth) {
//         return true;
//     }
//
//     return false;
// }
