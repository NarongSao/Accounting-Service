import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
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
        }
    }).validator(),
    run({loanAccId}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Get loan acc
            let setting = Setting.findOne(),
                dayOfWeekToEscape = setting.dayOfWeekToEscape,
                holiday = Holiday.find().fetch(),
                loanAccDoc = lookupLoanAcc.call({_id: loanAccId}),
                principalInstallmentDoc = loanAccDoc.principalInstallment;

            // Declare default value
            let schedules = [];
            let principalInstallmentAmountPerLine = principalInstallmentDoc.amount;

            // Check principal installment calculate type
            if (principalInstallmentDoc.calculateType == 'P') {
                let numOfPrincipalInstallmentFrequency = _.ceil(loanAccDoc.term / principalInstallmentDoc.frequency);
                principalInstallmentAmountPerLine = (loanAccDoc.loanAmount / numOfPrincipalInstallmentFrequency) * (principalInstallmentDoc.amount / 100);
                principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, loanAccDoc.currencyId);
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
                dueDate: loanAccDoc.disbursementDate,
                numOfDay: 0,
                principalDue: 0,
                interestDue: 0,
                totalDue: 0,
                balance: loanAccDoc.loanAmount,
                allowClosing: false
            });

            // Schedule loop
            for (let i = 1; i <= loanAccDoc.term; i++) {
                let previousLine, dueDate, numOfDay, principalDue = 0, interestDue, totalDue;

                previousLine = schedules[i - 1];

                dueDate = findDueDate({
                    installment: i,
                    disbursementDate: loanAccDoc.disbursementDate,
                    previousDate: previousLine.dueDate,
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
                    dueDate = loanAccDoc.firstRepaymentDate;
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

                interestDue = Calculate.interest.call({
                    amount: previousLine.balance,
                    numOfDay: numOfDay,
                    interestRate: loanAccDoc.interestRate,
                    method: loanAccDoc.paymentMethod,
                    currencyId: loanAccDoc.currencyId
                });
                totalDue = roundCurrency(principalDue + interestDue, loanAccDoc.currencyId);
                balane = roundCurrency(previousLine.balance - principalDue, loanAccDoc.currencyId);

                // Check installment can close without penalty
                let allowClosing = false;
                if (i >= loanAccDoc.installmentAllowClosing) {
                    allowClosing = true;
                }
                schedules.push({
                    installment: i,
                    dueDate: dueDate,
                    numOfDay: numOfDay,
                    principalDue: principalDue,
                    interestDue: interestDue,
                    totalDue: totalDue,
                    balance: balane,
                    allowClosing: allowClosing
                });
            }

            return schedules;
        }
    }
});


// Functions
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

    // let dueDate = moment(opts.previousDate).add(opts.repaidFrequency, opts.addingTime).toDate();
    let dueDate = moment(opts.disbursementDate).add(opts.repaidFrequency * opts.installment, opts.addingTime).toDate();

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
                paymentMethod: opts.paymentMethod
            });

            // Check next escape
            if (moment(opts.previousDate).isBefore(getDoEscapeDay, 'day')) {
                getDoEscapeDay = _doEscapeDayWithFrequency(dueDate, {
                    escapeDayFrequency: opts.escapeDayFrequency,
                    dayOfWeekToEscape: opts.dayOfWeekToEscape,
                    holiday: opts.holiday,
                    paymentMethod: opts.paymentMethod
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
                paymentMethod: opts.paymentMethod
            });

            return getDoEscapeDay;
        }
    }

    return dueDate;
}

function _doEscapeDayWithFrequency(date, opts) {
    check(date, Date);

    new SimpleSchema({
        escapeDayFrequency: {type: Number},
        dayOfWeekToEscape: {type: [Number]},
        holiday: {type: [Object], blackbox: true},
        paymentMethod: {type: String}
    }).validate(opts);

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

    let tmpEscapeDay, tmpDate = date;

    do {
        tmpDate = moment(tmpDate).add(opts.escapeDayFrequency, 'd').toDate();

        // Check start of period
        if (opts.escapeDayFrequency < 0) {
            let startOf = moment(date).startOf(startOrEndOf);
            if (moment(tmpDate).isBefore(startOf, 'day')) {
                tmpEscapeDay = false;
                tmpDate = date;
            } else {
                tmpEscapeDay = _isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
            }
        } else {
            let endOf = moment(date).endOf(startOrEndOf);
            if (moment(tmpDate).isAfter(endOf, 'day')) {
                tmpEscapeDay = false;
                tmpDate = date;
            } else {
                tmpEscapeDay = _isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
            }
        }
    } while (tmpEscapeDay);

    return tmpDate;
}

function _isInEscapeDayAndDate(date, dayOfWeekToEscape, holiday) {
    check(date, Date);
    check(dayOfWeekToEscape, [Number]);
    check(holiday, [Object]);

    // Check date of month
    let checkDayOfWeek = _.includes(dayOfWeekToEscape, moment(date).isoWeekday());
    let checkDateOfMonth = _.find(holiday, (o)=> {
        return moment(date).isBetween(o.from, o.to, 'day', '[]');
    });

    if (checkDayOfWeek || checkDateOfMonth) {
        return true;
    }

    return false;
}
