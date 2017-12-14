import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment-timezone';
import math from 'mathjs';

// Lib
import {roundCurrency} from '../libs/round-currency.js';

// Method
import {Calculate} from '../libs/calculate.js';
import {lookupLoanAcc} from './lookup-loan-acc.js';

// Collection
import {Setting} from '../../common/collections/setting.js';
import {Holiday} from '../../common/collections/holiday.js';

export let MakeSchedule = {};

MakeSchedule.declinig = new ValidatedMethod({
    name: 'microfis.makeSchedule.declining',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {
            type: String
        },
        options: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, options}) {
        if (!this.isSimulation) {


            // Get loan acc
            let setting = Setting.findOne(),
                dayOfWeekToEscape = setting.dayOfWeekToEscape,
                holiday = Holiday.find().fetch(),
                loanAccDoc = lookupLoanAcc.call({_id: loanAccId}),
                principalInstallmentDoc = loanAccDoc.principalInstallment;

            // if (loanAccDoc.firstRepaymentDate) {
            //     loanAccDoc.firstRepaymentDate = moment(loanAccDoc.firstRepaymentDate).toDate();
            //
            // }

            // Overried loan account
            if (options != null) {
                loanAccDoc.disbursementDate = options.disbursementDate;
                loanAccDoc.loanAmount = options.loanAmount;
                loanAccDoc.term = options.term;
                loanAccDoc.firstRepaymentDate = options.firstRepaymentDate;
                loanAccDoc.installmentAllowClosing = options.installmentAllowClosing;

            }
            // if (loanAccDoc.disbursementDate) {
            //     loanAccDoc.disbursementDate = moment(loanAccDoc.disbursementDate).toDate();
            // }
            //

            // Declare default value
            let schedules = [];
            let principalInstallmentAmountPerLine = principalInstallmentDoc.amount;

            // Check principal installment calculate type
            if (principalInstallmentDoc.calculateType == 'P') {
                let numOfPrincipalInstallmentFrequency = _.ceil(loanAccDoc.term / principalInstallmentDoc.frequency);
                principalInstallmentAmountPerLine = (loanAccDoc.loanAmount / numOfPrincipalInstallmentFrequency) * (principalInstallmentDoc.amount / 100);
                principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, loanAccDoc.currencyId);

                if (loanAccDoc.currencyId == "USD") {
                    principalInstallmentAmountPerLine = math.round(principalInstallmentAmountPerLine);
                }
            }

            // Config moment addingTime for next due date
            let addingTime;
            switch (loanAccDoc.paymentMethod) {
                case 'D': // Daily
                    addingTime = 'd';
                    break;
                case 'W': // Weekly
                    addingTime = 'w';
                    break;
                case 'M': // Monthly
                    addingTime = 'M';
                    break;
                case 'Y': // Yearly
                    addingTime = 'y';
                    break;
            }

            // Schedule for first line
            schedules.push({
                installment: 0,
                dueDate: moment(loanAccDoc.disbursementDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate(),
                numOfDay: 0,
                principalDue: 0,
                interestDue: 0,
                feeOnPaymentDue: 0,
                totalDue: 0,
                balance: loanAccDoc.loanAmount,
                allowClosing: false
            });

            // Schedule loop
            for (let i = 1; i <= loanAccDoc.term; i++) {
                let previousLine, dueDate, numOfDay, principalDue = 0, interestDue, feeOnPaymentDue, totalDue;

                previousLine = schedules[i - 1];

                dueDate = findDueDate({
                    installment: i,
                    disbursementDate: loanAccDoc.disbursementDate,
                    previousDate: moment(previousLine.dueDate, "DD/MM/YYYY").startOf('days').add(12, "hours").toDate(),
                    repaidFrequency: loanAccDoc.repaidFrequency,
                    addingTime: addingTime,
                    escapeDayMethod: loanAccDoc.escapeDayMethod, // Non, GR, AN
                    escapeDayFrequency: loanAccDoc.escapeDayFrequency, // 1,2,3 ... times
                    dayOfWeekToEscape: dayOfWeekToEscape, // [6, 7] = Sat & Sun
                    holiday: holiday,
                    paymentMethod: loanAccDoc.paymentMethod,
                    dueDateOn: loanAccDoc.dueDateOn
                });

                // Check first repayment date
                if (i == 1 && loanAccDoc.firstRepaymentDate) {
                    dueDate = moment(loanAccDoc.firstRepaymentDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate();
                }


                numOfDay = moment(dueDate).diff(previousLine.dueDate, 'days');

                // Check principal due per line
                if (i % principalInstallmentDoc.frequency == 0) {
                    principalDue = principalInstallmentAmountPerLine;
                }

                // Check principal due for last line
                if (i == loanAccDoc.term) {
                    principalDue = previousLine.balance;
                }


                //Calculate Interest
                if (loanAccDoc.interestType == undefined || loanAccDoc.interestType == "P") {
                    interestDue = Calculate.interest.call({
                        amount: previousLine.balance,
                        numOfDay: numOfDay,
                        interestRate: loanAccDoc.interestRate,
                        method: loanAccDoc.paymentMethod,
                        currencyId: loanAccDoc.currencyId
                    });
                } else {
                    interestDue = loanAccDoc.interestRate;
                }


                //Calculate Fee On Payment

                feeOnPaymentDue = Calculate.feeOnPayment.call({
                    disbursementAmount: loanAccDoc.loanAmount,
                    amount: principalDue + interestDue,
                    principal: principalDue,
                    interest: interestDue,
                    currencyId: loanAccDoc.currencyId,
                    productDoc: loanAccDoc.productDoc,
                    loanOutstanding: roundCurrency(previousLine.balance, loanAccDoc.currencyId)
                })


                totalDue = roundCurrency(principalDue + interestDue + feeOnPaymentDue, loanAccDoc.currencyId);
                balance = roundCurrency(previousLine.balance - principalDue, loanAccDoc.currencyId);

                // Check installment can close without penalty
                let allowClosing = false;

                if (i >= loanAccDoc.installmentAllowClosing || i == loanAccDoc.term) {
                    allowClosing = true;
                }
                schedules.push({
                    installment: i,
                    dueDate: dueDate,
                    numOfDay: numOfDay,
                    principalDue: principalDue,
                    interestDue: interestDue,
                    feeOnPaymentDue: feeOnPaymentDue,
                    totalDue: totalDue,
                    balance: balance,
                    allowClosing: allowClosing
                });
            }

            return schedules;
        }
    }
});


MakeSchedule.annuity = new ValidatedMethod({
    name: 'microfis.makeSchedule.annuity',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {
            type: String
        },
        options: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, options}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Get loan acc
            let setting = Setting.findOne(),
                dayOfWeekToEscape = setting.dayOfWeekToEscape,
                holiday = Holiday.find().fetch(),
                loanAccDoc = lookupLoanAcc.call({_id: loanAccId});

            // if (loanAccDoc.firstRepaymentDate) {
            //     loanAccDoc.firstRepaymentDate = moment(loanAccDoc.firstRepaymentDate).toDate();
            //
            // }

            // Overried loan account
            if (options != null) {
                loanAccDoc.disbursementDate = options.disbursementDate;
                loanAccDoc.loanAmount = options.loanAmount;
                loanAccDoc.term = options.term;
                loanAccDoc.firstRepaymentDate = options.firstRepaymentDate;
                loanAccDoc.installmentAllowClosing = options.installmentAllowClosing;

            }
            // if (loanAccDoc.disbursementDate) {
            //     loanAccDoc.disbursementDate = moment(loanAccDoc.disbursementDate).toDate();
            // }
            //
            // Declare default value
            let schedules = [];
            let principalInstallmentAmountPerLine = ((loanAccDoc.interestRate / 100) * loanAccDoc.repaidFrequency * loanAccDoc.loanAmount) / (1 - Math.pow(1 + (loanAccDoc.interestRate / 100) * loanAccDoc.repaidFrequency, -loanAccDoc.term));
            principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, loanAccDoc.currencyId);

            if (loanAccDoc.currencyId == "USD") {
                principalInstallmentAmountPerLine = math.round(principalInstallmentAmountPerLine);
            }


            // Config moment addingTime for next due date
            let addingTime;
            switch (loanAccDoc.paymentMethod) {
                case 'D': // Daily
                    addingTime = 'd';
                    break;
                case 'W': // Weekly
                    addingTime = 'w';
                    break;
                case 'M': // Monthly
                    addingTime = 'M';
                    break;
                case 'Y': // Yearly
                    addingTime = 'y';
                    break;
            }

            // Schedule for first line
            schedules.push({
                installment: 0,
                dueDate: moment(loanAccDoc.disbursementDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate(),
                numOfDay: 0,
                principalDue: 0,
                interestDue: 0,
                feeOnPaymentDue: 0,
                totalDue: 0,
                balance: loanAccDoc.loanAmount,
                allowClosing: false
            });

            // Schedule loop
            for (let i = 1; i <= loanAccDoc.term; i++) {
                let previousLine, dueDate, numOfDay, principalDue = 0, interestDue, feeOnPaymentDue, totalDue;

                previousLine = schedules[i - 1];

                dueDate = findDueDate({
                    installment: i,
                    disbursementDate: loanAccDoc.disbursementDate,
                    previousDate: moment(previousLine.dueDate, "DD/MM/YYYY").startOf('days').add(12, "hours").toDate(),
                    repaidFrequency: loanAccDoc.repaidFrequency,
                    addingTime: addingTime,
                    escapeDayMethod: loanAccDoc.escapeDayMethod, // Non, GR, AN
                    escapeDayFrequency: loanAccDoc.escapeDayFrequency, // 1,2,3 ... times
                    dayOfWeekToEscape: dayOfWeekToEscape, // [6, 7] = Sat & Sun
                    holiday: holiday,
                    paymentMethod: loanAccDoc.paymentMethod,
                    dueDateOn: loanAccDoc.dueDateOn
                });

                // Check first repayment date
                if (i == 1 && loanAccDoc.firstRepaymentDate) {
                    dueDate = moment(loanAccDoc.firstRepaymentDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate();
                }


                numOfDay = moment(dueDate).diff(previousLine.dueDate, 'days');


                //Calculate Interest


                if (loanAccDoc.interestType == undefined || loanAccDoc.interestType == "P") {
                    interestDue = Calculate.interest.call({
                        amount: previousLine.balance,
                        numOfDay: numOfDay,
                        interestRate: loanAccDoc.interestRate,
                        method: loanAccDoc.paymentMethod,
                        currencyId: loanAccDoc.currencyId
                    });
                } else {
                    interestDue = loanAccDoc.interestRate;
                }


                //calculate principal
                principalDue = principalInstallmentAmountPerLine - interestDue;
                if (i == loanAccDoc.term) {
                    principalDue = previousLine.balance;
                }

                //Calculate Fee On Payment

                feeOnPaymentDue = Calculate.feeOnPayment.call({
                    disbursementAmount: loanAccDoc.loanAmount,
                    amount: principalDue + interestDue,
                    principal: principalDue,
                    interest: interestDue,
                    currencyId: loanAccDoc.currencyId,
                    productDoc: loanAccDoc.productDoc,
                    loanOutstanding: roundCurrency(previousLine.balance, loanAccDoc.currencyId)
                })

                totalDue = roundCurrency(principalDue + interestDue + feeOnPaymentDue, loanAccDoc.currencyId);
                balance = roundCurrency(previousLine.balance - principalDue, loanAccDoc.currencyId);

                // Check installment can close without penalty
                let allowClosing = false;

                if (i >= loanAccDoc.installmentAllowClosing || i == loanAccDoc.term) {
                    allowClosing = true;
                }
                schedules.push({
                    installment: i,
                    dueDate: dueDate,
                    numOfDay: numOfDay,
                    principalDue: principalDue,
                    interestDue: interestDue,
                    feeOnPaymentDue: feeOnPaymentDue,
                    totalDue: totalDue,
                    balance: balance,
                    allowClosing: allowClosing
                });
            }

            return schedules;
        }
    }
});


MakeSchedule.flat = new ValidatedMethod({
    name: 'microfis.makeSchedule.flat',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        loanAccId: {
            type: String
        },
        options: {type: Object, optional: true, blackbox: true}
    }).validator(),
    run({loanAccId, options}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Get loan acc
            let setting = Setting.findOne(),
                dayOfWeekToEscape = setting.dayOfWeekToEscape,
                holiday = Holiday.find().fetch(),
                loanAccDoc = lookupLoanAcc.call({_id: loanAccId});

            // if (loanAccDoc.firstRepaymentDate) {
            //     loanAccDoc.firstRepaymentDate = moment(loanAccDoc.firstRepaymentDate).toDate();
            //
            // }

            // Overried loan account
            if (options != null) {
                loanAccDoc.disbursementDate = options.disbursementDate;
                loanAccDoc.loanAmount = options.loanAmount;
                loanAccDoc.term = options.term;
                loanAccDoc.firstRepaymentDate = options.firstRepaymentDate;
                loanAccDoc.installmentAllowClosing = options.installmentAllowClosing;

            }
            // if (loanAccDoc.disbursementDate) {
            //     loanAccDoc.disbursementDate = moment(loanAccDoc.disbursementDate).toDate();
            // }
            //
            // Declare default value
            let schedules = [];
            let principalInstallmentAmountPerLine = loanAccDoc.loanAmount / loanAccDoc.term;
            principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, loanAccDoc.currencyId);


            let interestDue;

            if (loanAccDoc.interestType == undefined || loanAccDoc.interestType == "P") {
                interestDue = loanAccDoc.loanAmount * loanAccDoc.interestRate / 100;
                interestDue = roundCurrency(interestDue, loanAccDoc.currencyId);
            } else {
                interestDue = loanAccDoc.interestRate;
            }


            if (loanAccDoc.currencyId == "USD") {
                principalInstallmentAmountPerLine = math.round(principalInstallmentAmountPerLine,2);
            }


            // Config moment addingTime for next due date
            let addingTime;
            switch (loanAccDoc.paymentMethod) {
                case 'D': // Daily
                    addingTime = 'd';
                    break;
                case 'W': // Weekly
                    addingTime = 'w';
                    break;
                case 'M': // Monthly
                    addingTime = 'M';
                    break;
                case 'Y': // Yearly
                    addingTime = 'y';
                    break;
            }

            // Schedule for first line
            schedules.push({
                installment: 0,
                dueDate: moment(loanAccDoc.disbursementDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate(),
                numOfDay: 0,
                principalDue: 0,
                interestDue: 0,
                feeOnPaymentDue: 0,
                totalDue: 0,
                balance: loanAccDoc.loanAmount,
                allowClosing: false
            });

            // Schedule loop
            for (let i = 1; i <= loanAccDoc.term; i++) {
                let previousLine, dueDate, numOfDay, principalDue = 0, feeOnPaymentDue, totalDue;

                previousLine = schedules[i - 1];

                dueDate = findDueDate({
                    installment: i,
                    disbursementDate: loanAccDoc.disbursementDate,
                    previousDate: moment(previousLine.dueDate, "DD/MM/YYYY").startOf('days').add(12, "hours").toDate(),
                    repaidFrequency: loanAccDoc.repaidFrequency,
                    addingTime: addingTime,
                    escapeDayMethod: loanAccDoc.escapeDayMethod, // Non, GR, AN
                    escapeDayFrequency: loanAccDoc.escapeDayFrequency, // 1,2,3 ... times
                    dayOfWeekToEscape: dayOfWeekToEscape, // [6, 7] = Sat & Sun
                    holiday: holiday,
                    paymentMethod: loanAccDoc.paymentMethod,
                    dueDateOn: loanAccDoc.dueDateOn
                });

                // Check first repayment date
                if (i == 1 && loanAccDoc.firstRepaymentDate) {
                    dueDate = moment(loanAccDoc.firstRepaymentDate, "DD/MM/YYYY").startOf("days").add(12, "hours").toDate();
                }


                numOfDay = moment(dueDate).diff(previousLine.dueDate, 'days');


                //calculate principal
                principalDue = principalInstallmentAmountPerLine;
                if (i == loanAccDoc.term) {
                    principalDue = previousLine.balance;
                }

                //Calculate Fee On Payment

                feeOnPaymentDue = Calculate.feeOnPayment.call({
                    disbursementAmount: loanAccDoc.loanAmount,
                    amount: principalDue + interestDue,
                    principal: principalDue,
                    interest: interestDue,
                    currencyId: loanAccDoc.currencyId,
                    productDoc: loanAccDoc.productDoc,
                    loanOutstanding: roundCurrency(previousLine.balance, loanAccDoc.currencyId)
                })

                totalDue = roundCurrency(principalDue + interestDue + feeOnPaymentDue, loanAccDoc.currencyId);
                let balance = roundCurrency(previousLine.balance - principalDue, loanAccDoc.currencyId);

                // Check installment can close without penalty
                let allowClosing = false;

                if (i >= loanAccDoc.installmentAllowClosing || i == loanAccDoc.term) {
                    allowClosing = true;
                }
                schedules.push({
                    installment: i,
                    dueDate: dueDate,
                    numOfDay: numOfDay,
                    principalDue: principalDue,
                    interestDue: interestDue,
                    feeOnPaymentDue: feeOnPaymentDue,
                    totalDue: totalDue,
                    balance: balance,
                    allowClosing: allowClosing
                });
            }

            return schedules;
        }
    }
});

/**************** Functions *********************/
function findDueDate(opts) {
    new SimpleSchema({
        installment: {
            type: Number
        },
        disbursementDate: {
            type: Date
        },
        previousDate: {
            type: Date
        },
        repaidFrequency: {
            type: Number
        },
        addingTime: {
            type: String
        },
        escapeDayMethod: {
            type: String
        },
        escapeDayFrequency: {
            type: Number
        },
        dayOfWeekToEscape: {
            type: [Number] // [6,7]
        },
        holiday: {
            type: [Object], // [{from: '2016-01-01', to: '2016-01-01'}, {from: '2016-04-13', to: '2016-04-16'}]
            blackbox: true
        },
        paymentMethod: {
            type: String
        },
        dueDateOn: {
            type: Number
        }
    }).validate(opts);

    if (!this.isSimulation) {

        let dueDate = moment(opts.previousDate).startOf("day").add(12, "hours").add(opts.repaidFrequency, opts.addingTime).toDate();
        let curTimezone = moment.tz.guess();
        // let orgDate = moment(opts.previousDate).tz("Asia/Bangkok").format('YYYY/MM/DD HH:mm:ss');
        // console.log(orgDate);
        // let dueDate = moment(orgDate).add(opts.repaidFrequency, opts.addingTime).toDate();
        // console.log("After Convert" + dueDate);

        // let dueDate = moment(opts.previousDate).startOf('days').add(opts.repaidFrequency, opts.addingTime).toDate();
        // let dueDate = moment(opts.disbursementDate).add(opts.repaidFrequency * opts.installment, opts.addingTime).toDate();

        // Check due date on
        if (opts.paymentMethod == 'W') {
            dueDate = moment(dueDate).isoWeekday(opts.dueDateOn).toDate();
        } else if (opts.paymentMethod == 'M' || opts.paymentMethod == 'Y') {
            dueDate = moment(dueDate).date(opts.dueDateOn).toDate();
        }

        // Check day escape
        if (opts.escapeDayMethod == 'GR') { // General = Previous & Next
            let inEscapeDay = _isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.holiday);
            if (inEscapeDay) {
                let getDoEscapeDay;

                // Check previous escape
                getDoEscapeDay = _doEscapeDayWithFrequency(dueDate, {
                    escapeDayFrequency: -opts.escapeDayFrequency,
                    dayOfWeekToEscape: opts.dayOfWeekToEscape,
                    holiday: opts.holiday,
                    paymentMethod: opts.paymentMethod,
                    escapeDayMethod: opts.escapeDayMethod
                });

                // Check next escape
                if (moment(dueDate).isSame(getDoEscapeDay, 'day')) {
                    getDoEscapeDay = _doEscapeDayWithFrequency(dueDate, {
                        escapeDayFrequency: opts.escapeDayFrequency,
                        dayOfWeekToEscape: opts.dayOfWeekToEscape,
                        holiday: opts.holiday,
                        paymentMethod: opts.paymentMethod,
                        escapeDayMethod: opts.escapeDayMethod
                    });
                }


                return getDoEscapeDay;
            }
        } else if (opts.escapeDayMethod == 'AN') { // Always Next
            let escapeDay = _isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.holiday);
            if (escapeDay) {
                let getDoEscapeDay;

                // Check always next
                getDoEscapeDay = _doEscapeDayWithFrequency(dueDate, {
                    escapeDayFrequency: opts.escapeDayFrequency,
                    dayOfWeekToEscape: opts.dayOfWeekToEscape,
                    holiday: opts.holiday,
                    paymentMethod: opts.paymentMethod,
                    escapeDayMethod: opts.escapeDayMethod
                });

                return getDoEscapeDay;
            }
        }

        return dueDate;
    }
}

function _doEscapeDayWithFrequency(date, opts) {
    check(date, Date);

    new SimpleSchema({
        escapeDayFrequency: {type: Number},
        dayOfWeekToEscape: {type: [Number]},
        holiday: {type: [Object], blackbox: true},
        paymentMethod: {type: String},
        escapeDayMethod: {type: String}
    }).validate(opts);
    if (!this.isSimulation) {
        let startOrEndOf;
        switch (opts.paymentMethod) {
            case 'D': // Daily
                startOrEndOf = 'day';
                break;
            case 'W': // Weekly
                startOrEndOf = 'isoWeek';
                break;
            case 'M': // Monthly
                startOrEndOf = 'month';
                break;
            case 'Y': // Yearly
                startOrEndOf = 'year';
                break;
        }

        let tmpEscapeDay, tmpDate = moment(date).toDate();
        let startOf = moment(date).startOf(startOrEndOf);
        let endOf = moment(date).endOf(startOrEndOf);

        do {
            tmpDate = moment(tmpDate).add(opts.escapeDayFrequency, 'd').toDate();

            // Check start of period
            if (opts.escapeDayFrequency < 0) {
                if (moment(tmpDate).isBefore(startOf, 'day')) {
                    tmpEscapeDay = false;
                    tmpDate = date;
                } else {
                    tmpEscapeDay = _isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
                }
            } else {
                // Check escapeDayMethod = GR || AN
                if (opts.escapeDayMethod == 'GR') {
                    if (moment(tmpDate).isAfter(endOf, 'day')) {
                        tmpEscapeDay = false;
                        tmpDate = date;
                    } else {
                        tmpEscapeDay = _isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
                    }
                } else { // AN
                    tmpEscapeDay = _isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
                }
            }
        } while (tmpEscapeDay);

        return tmpDate;
    }
}

function _isInEscapeDayAndDate(date, dayOfWeekToEscape, holiday) {
    check(date, Date);
    check(dayOfWeekToEscape, [Number]);
    check(holiday, [Object]);

    if (!this.isSimulation) {

        // Check date of month
        let checkDayOfWeek = _.includes(dayOfWeekToEscape, moment(date).isoWeekday());
        let checkDateOfMonth = _.find(holiday, (o) => {
            return moment(date).isBetween(o.from, o.to, 'day', '[]');
        });

        if (checkDayOfWeek || checkDateOfMonth) {
            return true;
        }

        return false;
    }
}

