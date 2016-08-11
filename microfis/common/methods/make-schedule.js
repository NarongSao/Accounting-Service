import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';

// Lib
import {roundCurrency} from '../../imports/api/libs/round-currency.js';

// Method
import {Calculate} from './libs/calculate.js';
import {lookupDisbursement} from './lookup-disbursement.js';

// Collection
import {Setting} from '../../imports/api/collections/setting.js';
import {Holiday} from '../../imports/api/collections/holiday.js';

export let MakeSchedule = {};

MakeSchedule.declinig = new ValidatedMethod({
    name: 'microfis.makeSchedule.declining',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        disbursementId: {
            type: String
        }
    }).validator(),
    run({disbursementId}) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);

            // Get disbursement
            let setting = Setting.findOne(),
                dayOfWeekToEscape = setting.dayOfWeekToEscape,
                holiday = Holiday.find().fetch(),
                disbursementDoc = lookupDisbursement.call({_id: disbursementId}),
                principalInstallmentDoc = disbursementDoc.principalInstallment;

            // Declare default value
            let schedules = [];
            let principalInstallmentAmountPerLine = principalInstallmentDoc.amount;

            // Check principal installment calculate type
            if (principalInstallmentDoc.calculateType == 'P') {
                let numOfPrincipalInstallmentFrequency = _.ceil(disbursementDoc.term / principalInstallmentDoc.frequency);
                principalInstallmentAmountPerLine = (disbursementDoc.microfisAmount / numOfPrincipalInstallmentFrequency) * (principalInstallmentDoc.amount / 100);
                principalInstallmentAmountPerLine = roundCurrency(principalInstallmentAmountPerLine, disbursementDoc.currencyId);
            }

            // Config moment addingTime for next due date
            let addingTime;
            switch (disbursementDoc.paymentMethod) {
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
                dueDate: disbursementDoc.disbursementDate,
                numOfDay: 0,
                principalDue: 0,
                interestDue: 0,
                totalDue: 0,
                balance: disbursementDoc.microfisAmount,
                allowClosing: false
            });

            // Schedule loop
            for (let i = 1; i <= disbursementDoc.term; i++) {
                let previousLine, dueDate, numOfDay, principalDue = 0, interestDue, totalDue;

                previousLine = schedules[i - 1];

                dueDate = findDueDate({
                    installment: i,
                    disbursementDate: disbursementDoc.disbursementDate,
                    previousDate: previousLine.dueDate,
                    repaidFrequency: disbursementDoc.repaidFrequency,
                    addingTime: addingTime,
                    escapeDayMethod: disbursementDoc.escapeDayMethod, // [6, 0]
                    escapeDayFrequency: disbursementDoc.escapeDayFrequency, // 1,2,3 ... times
                    dayOfWeekToEscape: dayOfWeekToEscape, // [6, 0]
                    holiday: holiday,
                    paymentMethod: disbursementDoc.paymentMethod,
                    dueDateOn: disbursementDoc.dueDateOn
                });

                // Check first repayment date
                if (i == 1 && disbursementDoc.firstRepaymentDate) {
                    dueDate = disbursementDoc.firstRepaymentDate;
                }
                numOfDay = moment(dueDate).diff(previousLine.dueDate, 'days');

                // Check principal due per line
                if (i % principalInstallmentDoc.frequency == 0) {
                    principalDue = principalInstallmentAmountPerLine;
                }

                // Check principal due for last line
                if (i == disbursementDoc.term) {
                    principalDue = previousLine.balance;
                }

                interestDue = Calculate.interest.call({
                    amount: previousLine.balance,
                    numOfDay: numOfDay,
                    interestRate: disbursementDoc.interestRate,
                    method: disbursementDoc.paymentMethod,
                    currencyId: disbursementDoc.currencyId
                });
                totalDue = roundCurrency(principalDue + interestDue, disbursementDoc.currencyId);
                balane = roundCurrency(previousLine.balance - principalDue, disbursementDoc.currencyId);

                // Check installment can close without penalty
                let allowClosing = false;
                if (i >= disbursementDoc.installmentAllowClosing) {
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
    if (opts.escapeDayMethod == 'PN') { // Previous & Next
        let escapeDay = isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.holiday);
        if (escapeDay) {
            let getDoEscapeDay;

            // Check previous escape
            getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
                escapeDayFrequency: -opts.escapeDayFrequency,
                dayOfWeekToEscape: opts.dayOfWeekToEscape,
                holiday: opts.holiday
            });

            // Check next escape
            if (moment(opts.previousDate).isBefore(getDoEscapeDay)) {
                getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
                    escapeDayFrequency: opts.escapeDayFrequency,
                    dayOfWeekToEscape: opts.dayOfWeekToEscape,
                    holiday: opts.holiday
                });
            }

            return getDoEscapeDay;
        }
    } else if (opts.escapeDayMethod == 'AN') { // Always Next
        let escapeDay = isInEscapeDayAndDate(dueDate, opts.dayOfWeekToEscape, opts.holiday);
        if (escapeDay) {
            let getDoEscapeDay;

            // Check always next
            getDoEscapeDay = doEscapeDayWithFrequency(dueDate, {
                escapeDayFrequency: opts.escapeDayFrequency,
                dayOfWeekToEscape: opts.dayOfWeekToEscape,
                holiday: opts.holiday
            });

            return getDoEscapeDay;
        }
    }

    return dueDate;
}

function doEscapeDayWithFrequency(date, opts) {
    check(date, Date);

    new SimpleSchema({
        escapeDayFrequency: {type: Number},
        dayOfWeekToEscape: {type: [Number]},
        holiday: {type: [Object], blackbox: true}
    }).validate(opts);

    let tmpEscapeDay, tmpDate = date;

    do {
        tmpDate = moment(tmpDate).add(opts.escapeDayFrequency, 'd').toDate();
        tmpEscapeDay = isInEscapeDayAndDate(tmpDate, opts.dayOfWeekToEscape, opts.holiday);
    } while (tmpEscapeDay);

    return tmpDate;
}

function isInEscapeDayAndDate(date, dayOfWeekToEscape, holiday) {
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
