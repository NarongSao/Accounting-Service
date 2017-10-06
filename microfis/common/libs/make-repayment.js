import {check} from 'meteor/check';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {_} from 'meteor/erasaur:meteor-lodash';
import moment from 'moment';
import math from 'mathjs';
import BigNumber from 'bignumber.js';
import {round2} from 'meteor/theara:round2';

// Lib
import {roundCurrency} from './round-currency.js';

// Method
import {Calculate} from './calculate.js';

//Collection

import {SavingTransaction} from '../collections/saving-transaction.js'
import {RepaymentSchedule} from '../collections/repayment-schedule'

export let MakeRepayment = {};

MakeRepayment.general = function ({repaidDate, amountPaid, penaltyPaid, scheduleDue, totalScheduleDue, opts}) {
    new SimpleSchema({
        repaidDate: {
            type: Date
        },
        amountPaid: {
            type: Number,
            decimal: true,
            min: 0.01
        },
        penaltyPaid: {
            type: Number,
            decimal: true,
            min: 0,
            optional: true
        },
        scheduleDue: {
            type: Array,
            min: 1
        },
        'scheduleDue.$': {
            type: Object,
            blackbox: true
        },
        totalScheduleDue: {
            type: Object,
            blackbox: true
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        }
    }).validate({scheduleDue, totalScheduleDue, repaidDate, amountPaid, penaltyPaid, opts});

    //---------------------------
    // Declare schedule paid
    let schedulePaid = [];
    let totalSchedulePaid = {
        principalDue: new BigNumber(0),
        interestDue: new BigNumber(0),
        feeOnPaymentDue: new BigNumber(0),
        totalPrincipalInterestDue: new BigNumber(0),
        penaltyDue: new BigNumber(0),
        totalAmountDue: new BigNumber(0),

        principalPaid: new BigNumber(0),
        interestPaid: new BigNumber(0),
        feeOnPaymentPaid: new BigNumber(0),
        totalPrincipalInterestPaid: new BigNumber(0),
        penaltyPaid: new BigNumber(0),
        totalAmountPaid: new BigNumber(0),

        interestWaived: new BigNumber(0),

        principalBal: new BigNumber(0),
        interestBal: new BigNumber(0),
        feeOnPaymentBal: new BigNumber(0),
        totalPrincipalInterestBal: new BigNumber(0),
        penaltyBal: new BigNumber(0),
        totalAmountBal: new BigNumber(0)
    };

    let tmpAmountPaid = new BigNumber(amountPaid);
    let tmpPenaltyPaid = new BigNumber(penaltyPaid);

    for (let o of scheduleDue) {
        if (tmpAmountPaid > 0) {
            let currentDue = o.currentDue;

            // Check amount paid
            let principalPaid = new BigNumber(0),
                interestPaid = new BigNumber(0),
                feeOnPaymentPaid = new BigNumber(0);


            if (tmpAmountPaid.lessThanOrEqualTo(currentDue.feeOnPayment)) {
                feeOnPaymentPaid = tmpAmountPaid;
                tmpAmountPaid = new BigNumber(0);

            } else {
                feeOnPaymentPaid = new BigNumber(currentDue.feeOnPayment);
                tmpAmountPaid = tmpAmountPaid.minus(feeOnPaymentPaid);


                if (tmpAmountPaid.lessThanOrEqualTo(currentDue.interest)) {
                    interestPaid = tmpAmountPaid;
                    tmpAmountPaid = new BigNumber(0);
                } else {
                    interestPaid = new BigNumber(currentDue.interest);
                    tmpAmountPaid = tmpAmountPaid.minus(interestPaid);

                    // Check principal
                    if (tmpAmountPaid.lessThanOrEqualTo(currentDue.principal)) {
                        principalPaid = tmpAmountPaid;
                        tmpAmountPaid = new BigNumber(0);
                    } else {
                        principalPaid = new BigNumber(currentDue.principal);
                        tmpAmountPaid = tmpAmountPaid.minus(principalPaid);
                    }
                }
            }


            // Check penalty paid
            let penaltyPaid = new BigNumber(0);

            if (tmpPenaltyPaid.greaterThan(0)) {
                if (tmpPenaltyPaid.lessThanOrEqualTo(currentDue.penalty)) {
                    penaltyPaid = tmpPenaltyPaid;
                    tmpPenaltyPaid = new BigNumber(0);
                } else {
                    penaltyPaid = new BigNumber(currentDue.penalty);
                    tmpPenaltyPaid = tmpPenaltyPaid.minus(penaltyPaid);
                }
            }

            // Push data
            let totalPrincipalInterestPaid = principalPaid.plus(interestPaid.plus(feeOnPaymentPaid)),
                totalAmountPaid = totalPrincipalInterestPaid.plus(penaltyPaid),
                principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
                interestBal = new BigNumber(currentDue.interest).minus(interestPaid),
                feeOnPaymentBal = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid),
                totalPrincipalInterestBal = principalBal.plus(interestBal.plus(feeOnPaymentBal)),
                penaltyBal = new BigNumber(currentDue.penalty).minus(penaltyPaid),
                totalAmountBal = totalPrincipalInterestBal.plus(penaltyBal);

            let status = 'Partial';
            if (totalPrincipalInterestBal.isZero()) {
                status = 'Complete';
            }

            // Total schedule paid
            totalSchedulePaid = {
                principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
                interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
                feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.plus(currentDue.feeOnPayment),
                totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
                penaltyDue: totalSchedulePaid.penaltyDue.plus(currentDue.penalty),
                totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

                principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
                interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
                feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.plus(feeOnPaymentPaid),
                totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
                penaltyPaid: totalSchedulePaid.penaltyPaid.plus(penaltyPaid),
                totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

                interestWaived: new BigNumber(0),
                feeOnPaymentWaived: new BigNumber(0),

                principalBal: totalSchedulePaid.principalBal.plus(principalBal),
                interestBal: totalSchedulePaid.interestBal.plus(interestBal),
                feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.plus(feeOnPaymentBal),
                totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
                penaltyBal: totalSchedulePaid.penaltyBal.plus(penaltyBal),
                totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
            };


            // Update repaidDoc
            let detailPaid = {
                scheduleId: o._id,
                installment: o.installment,
                repaidDate: repaidDate,
                numOfDayLate: currentDue.numOfDayLate,

                principalDue: currentDue.principal,
                interestDue: currentDue.interest,
                feeOnPaymentDue: currentDue.feeOnPayment,
                totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
                penaltyDue: currentDue.penalty,
                totalAmountDue: currentDue.totalAmount,

                principalPaid: principalPaid.toNumber(),
                interestPaid: interestPaid.toNumber(),
                feeOnPaymentPaid: feeOnPaymentPaid.toNumber(),
                totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
                penaltyPaid: penaltyPaid.toNumber(),
                totalAmountPaid: totalAmountPaid.toNumber(),

                interestWaived: 0,
                feeOnPaymentWaived: 0,

                principalBal: principalBal.toNumber(),
                interestBal: interestBal.toNumber(),
                feeOnPaymentBal: feeOnPaymentBal.toNumber(),
                totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
                penaltyBal: penaltyBal.toNumber(),
                totalAmountBal: totalAmountBal.toNumber(),
                status: status
            };


            schedulePaid.push(detailPaid);

            // Check tmpAmountPaid
            if (tmpAmountPaid.isZero() && tmpPenaltyPaid.isZero()) {
                break;
            }
        }

    } // End for-loop of schedule due

    // Convert BigNumber of totalSchedulePaid
    totalSchedulePaid = {
        principalDue: totalSchedulePaid.principalDue.toNumber(),
        interestDue: totalSchedulePaid.interestDue.toNumber(),
        feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.toNumber(),
        totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.toNumber(),
        penaltyDue: totalSchedulePaid.penaltyDue.toNumber(),
        totalAmountDue: totalSchedulePaid.totalAmountDue.toNumber(),

        principalPaid: totalSchedulePaid.principalPaid.toNumber(),
        interestPaid: totalSchedulePaid.interestPaid.toNumber(),
        feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.toNumber(),
        totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.toNumber(),
        penaltyPaid: totalSchedulePaid.penaltyPaid.toNumber(),
        totalAmountPaid: totalSchedulePaid.totalAmountPaid.toNumber(),

        interestWaived: totalSchedulePaid.interestWaived.toNumber(),
        feeOnPaymentWaived: totalSchedulePaid.feeOnPaymentWaived.toNumber(),

        principalBal: totalSchedulePaid.principalBal.toNumber(),
        interestBal: totalSchedulePaid.interestBal.toNumber(),
        feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.toNumber(),
        totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.toNumber(),
        penaltyBal: totalSchedulePaid.penaltyBal.toNumber(),
        totalAmountBal: totalSchedulePaid.totalAmountBal.toNumber()
    };

    // Return amount
    let returnAmountPaid = new BigNumber(amountPaid).minus(totalScheduleDue.totalPrincipalInterestDue);
    let returnPenaltyPaid = new BigNumber(penaltyPaid).minus(totalScheduleDue.penaltyDue);

    return {
        schedulePaid: schedulePaid,
        totalSchedulePaid: totalSchedulePaid,
        returnAmount: {
            returnAmountPaid: returnAmountPaid.toNumber(),
            returnPenaltyPaid: returnPenaltyPaid.toNumber()
        }
    };
};

MakeRepayment.prepay = function ({repaidDate, amountPaid, scheduleNext, opts}) {
    // Validate
    new SimpleSchema({
        repaidDate: {
            type: Date
        },
        amountPaid: {
            type: Number,
            decimal: true,
            min: 0.01
        },
        scheduleNext: {
            type: Array,
            min: 1
        },
        'scheduleNext.$': {
            type: Object,
            blackbox: true
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        }
    }).validate({scheduleNext, repaidDate, amountPaid, opts});

    //---------------------------

    let schedulePaid = [];
    let tmpAmountPaid = new BigNumber(amountPaid);

    // Total schedule paid
    let totalSchedulePaid = {
        principalDue: new BigNumber(0),
        interestDue: new BigNumber(0),
        feeOnPaymentDue: new BigNumber(0),
        totalPrincipalInterestDue: new BigNumber(0),
        penaltyDue: 0,
        totalAmountDue: new BigNumber(0),

        principalPaid: new BigNumber(0),
        interestPaid: new BigNumber(0),
        feeOnPaymentPaid: new BigNumber(0),
        totalPrincipalInterestPaid: new BigNumber(0),
        penaltyPaid: 0,
        totalAmountPaid: new BigNumber(0),

        interestWaived: new BigNumber(0),
        feeOnPaymentWaived: new BigNumber(0),

        principalBal: new BigNumber(0),
        interestBal: new BigNumber(0),
        feeOnPaymentBal: new BigNumber(0),
        totalPrincipalInterestBal: new BigNumber(0),
        penaltyBal: 0,
        totalAmountBal: new BigNumber(0)
    };


    for (let o of scheduleNext) {
        if (tmpAmountPaid > 0) {
            let currentDue = o.currentDue;

            // Check amount paid
            let principalPaid = new BigNumber(0),
                interestPaid = new BigNumber(0),
                feeOnPaymentPaid = new BigNumber(0);


            if (tmpAmountPaid.lessThanOrEqualTo(currentDue.feeOnPayment)) {
                feeOnPaymentPaid = tmpAmountPaid;
                tmpAmountPaid = new BigNumber(0);
            } else {
                feeOnPaymentPaid = new BigNumber(currentDue.feeOnPayment);
                tmpAmountPaid = tmpAmountPaid.minus(feeOnPaymentPaid);

                if (tmpAmountPaid.lessThanOrEqualTo(currentDue.interest)) {
                    interestPaid = tmpAmountPaid;
                    tmpAmountPaid = new BigNumber(0);
                } else {
                    interestPaid = new BigNumber(currentDue.interest);
                    tmpAmountPaid = tmpAmountPaid.minus(interestPaid);

                    // Check principal
                    if (tmpAmountPaid.lessThanOrEqualTo(currentDue.principal)) {
                        principalPaid = tmpAmountPaid;
                        tmpAmountPaid = new BigNumber(0);
                    } else {
                        principalPaid = new BigNumber(currentDue.principal);
                        tmpAmountPaid = tmpAmountPaid.minus(principalPaid);
                    }
                }

            }


            // Push data
            let totalPrincipalInterestPaid = principalPaid.plus(interestPaid),
                totalAmountPaid = totalPrincipalInterestPaid,
                principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
                interestBal = new BigNumber(currentDue.interest).minus(interestPaid),
                feeOnPaymentBal = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid),
                totalPrincipalInterestBal = principalBal.plus(interestBal.plus(feeOnPaymentBal)),
                penaltyBal = 0,
                totalAmountBal = totalPrincipalInterestBal;

            let status = 'Partial';
            if (totalPrincipalInterestBal.isZero()) {
                status = 'Complete';
            }


            // Total schedule paid
            totalSchedulePaid = {
                principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
                interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
                feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.plus(currentDue.feeOnPayment),
                totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
                penaltyDue: 0,
                totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

                principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
                interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
                feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.plus(feeOnPaymentPaid),
                totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
                penaltyPaid: 0,
                totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

                interestWaived: new BigNumber(0),
                feeOnPaymentWaived: new BigNumber(0),

                principalBal: totalSchedulePaid.principalBal.plus(principalBal),
                interestBal: totalSchedulePaid.interestBal.plus(interestBal),
                feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.plus(feeOnPaymentBal),
                totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
                penaltyBal: 0,
                totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
            };

            // Update repaidDoc
            let detailPaid = {
                scheduleId: o._id,
                installment: o.installment,
                repaidDate: repaidDate,
                numOfDayLate: currentDue.numOfDayLate,

                principalDue: currentDue.principal,
                interestDue: currentDue.interest,
                feeOnPaymentDue: currentDue.feeOnPayment,
                totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
                penaltyDue: currentDue.penalty,
                totalAmountDue: currentDue.totalAmount,

                principalPaid: principalPaid.toNumber(),
                interestPaid: interestPaid.toNumber(),
                feeOnPaymentPaid: feeOnPaymentPaid.toNumber(),
                totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
                penaltyPaid: 0,
                totalAmountPaid: totalAmountPaid.toNumber(),

                interestWaived: 0,
                feeOnPaymentWaived: 0,

                principalBal: principalBal.toNumber(),
                interestBal: interestBal.toNumber(),
                feeOnPaymentBal: feeOnPaymentBal.toNumber(),
                totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
                penaltyBal: 0,
                totalAmountBal: totalAmountBal.toNumber(),
                status: status
            };

            schedulePaid.push(detailPaid);

            // Check tmpAmountPaid
            if (tmpAmountPaid.isZero()) {
                break;
            }
        }

    } // End for-loop of schedule due


    // Convert BigNumber of totalSchedulePaid
    totalSchedulePaid = {
        principalDue: totalSchedulePaid.principalDue.toNumber(),
        interestDue: totalSchedulePaid.interestDue.toNumber(),
        feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.toNumber(),
        totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.toNumber(),
        penaltyDue: 0,
        totalAmountDue: totalSchedulePaid.totalAmountDue.toNumber(),

        principalPaid: totalSchedulePaid.principalPaid.toNumber(),
        interestPaid: totalSchedulePaid.interestPaid.toNumber(),
        feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.toNumber(),
        totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.toNumber(),
        penaltyPaid: 0,
        totalAmountPaid: totalSchedulePaid.totalAmountPaid.toNumber(),

        interestWaived: totalSchedulePaid.interestWaived.toNumber(),
        feeOnPaymentWaived: totalSchedulePaid.feeOnPaymentWaived.toNumber(),

        principalBal: totalSchedulePaid.principalBal.toNumber(),
        interestBal: totalSchedulePaid.interestBal.toNumber(),
        feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.toNumber(),
        totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.toNumber(),
        penaltyBal: 0,
        totalAmountBal: totalSchedulePaid.totalAmountBal.toNumber()
    };

    return {
        schedulePaid: schedulePaid,
        totalSchedulePaid: totalSchedulePaid
    };
};

MakeRepayment.waiveInterest = function ({repaidDate, amountPaid, scheduleDue, scheduleNext, opts}) {
    // Validate
    new SimpleSchema({
        repaidDate: {
            type: Date
        },
        amountPaid: {
            type: Number,
            decimal: true,
            min: 0.01
        },
        scheduleDue: {
            type: Array,
            min: 1
        },
        'scheduleDue.$': {
            type: Object,
            blackbox: true
        },
        scheduleNext: {
            type: Array,
            min: 1
        },
        'scheduleNext.$': {
            type: Object,
            blackbox: true
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        }
    }).validate({repaidDate, amountPaid, scheduleDue, scheduleNext, opts});

    //---------------------------

    // Total schedule paid
    let schedulePaid = [];
    let totalSchedulePaid = {
        principalDue: new BigNumber(0),
        interestDue: new BigNumber(0),
        feeOnPaymentDue: new BigNumber(0),
        totalPrincipalInterestDue: new BigNumber(0),
        penaltyDue: new BigNumber(0),
        totalAmountDue: new BigNumber(0),

        principalPaid: new BigNumber(0),
        interestPaid: new BigNumber(0),
        feeOnPaymentPaid: new BigNumber(0),
        totalPrincipalInterestPaid: new BigNumber(0),
        penaltyPaid: new BigNumber(0),
        totalAmountPaid: new BigNumber(0),

        interestWaived: new BigNumber(0),
        feeOnPaymentWaived: new BigNumber(0),

        principalBal: new BigNumber(0),
        interestBal: new BigNumber(0),
        feeOnPaymentBal: new BigNumber(0),
        totalPrincipalInterestBal: new BigNumber(0),
        penaltyBal: new BigNumber(0),
        totalAmountBal: new BigNumber(0)
    };

    let tmpAmountPaid = new BigNumber(amountPaid); // only waive interest

    // Check schedule due
    for (let o of scheduleDue) {
        if (tmpAmountPaid > 0) {
            let currentDue = o.currentDue;

            // Check amount paid
            let principalPaid = new BigNumber(0),
                interestPaid = new BigNumber(0),
                feeOnPaymentPaid = new BigNumber(0),
                feeOnPaymentWaived = new BigNumber(0),
                interestWaived = new BigNumber(0);

            if (tmpAmountPaid.lessThanOrEqualTo(currentDue.interest)) {
                // interestPaid = tmpAmountPaid;
                interestWaived = new BigNumber(currentDue.interest).minus(tmpAmountPaid);
                feeOnPaymentWaived = new BigNumber(currentDue.feeOnPayment).minus(tmpAmountPaid);
                tmpAmountPaid = new BigNumber(0);
            } else {
                // interestPaid = new BigNumber(currentDue.interest);
                interestWaived = new BigNumber(currentDue.interest);
                feeOnPaymentWaived = new BigNumber(currentDue.feeOnPayment);
                tmpAmountPaid = tmpAmountPaid.minus(interestWaived);

                // Check principal
                // if (tmpAmountPaid.lessThanOrEqualTo(currentDue.principal)) {
                //     principalPaid = tmpAmountPaid;
                //     tmpAmountPaid = new BigNumber(0);
                // } else {
                //     principalPaid = new BigNumber(currentDue.principal);
                //     tmpAmountPaid = tmpAmountPaid.minus(principalPaid);
                // }
            }

            // Check penalty paid
            let penaltyPaid = new BigNumber(0);

            // if (tmpPenaltyPaid.greaterThan(0)) {
            //     if (tmpPenaltyPaid.lessThanOrEqualTo(currentDue.penalty)) {
            //         penaltyPaid = tmpPenaltyPaid;
            //         tmpPenaltyPaid = new BigNumber(0);
            //     } else {
            //         penaltyPaid = new BigNumber(currentDue.penalty);
            //         tmpPenaltyPaid = tmpPenaltyPaid.minus(penaltyPaid);
            //     }
            // }

            // Push data
            let totalPrincipalInterestPaid = principalPaid.plus(interestPaid),
                totalAmountPaid = totalPrincipalInterestPaid.plus(penaltyPaid),
                principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
                interestBal = new BigNumber(currentDue.interest).minus(interestPaid).minus(interestWaived),
                feeOnPaymentBal = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid).minus(feeOnPaymentWaived),
                totalPrincipalInterestBal = principalBal.plus(interestBal.plus(feeOnPaymentBal)),
                penaltyBal = new BigNumber(currentDue.penalty).minus(penaltyPaid),
                totalAmountBal = totalPrincipalInterestBal.plus(penaltyBal);

            let status = 'Partial';
            if (totalPrincipalInterestBal.isZero()) {
                status = 'Complete';
            }

            // Total schedule paid
            totalSchedulePaid = {
                principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
                interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
                totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
                penaltyDue: totalSchedulePaid.penaltyDue.plus(currentDue.penalty),
                totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

                principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
                interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
                totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
                penaltyPaid: totalSchedulePaid.penaltyPaid.plus(penaltyPaid),
                totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

                interestWaived: totalSchedulePaid.interestWaived.plus(interestWaived),

                principalBal: totalSchedulePaid.principalBal.plus(principalBal),
                interestBal: totalSchedulePaid.interestBal.plus(interestBal),
                totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
                penaltyBal: totalSchedulePaid.penaltyBal.plus(penaltyBal),
                totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
            };

            // Update repaidDoc
            let detailPaid = {
                scheduleId: o._id,
                installment: o.installment,
                repaidDate: repaidDate,
                numOfDayLate: currentDue.numOfDayLate,

                principalDue: currentDue.principal,
                interestDue: currentDue.interest,
                totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
                penaltyDue: currentDue.penalty,
                totalAmountDue: currentDue.totalAmount,

                principalPaid: principalPaid.toNumber(),
                interestPaid: interestPaid.toNumber(),
                totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
                penaltyPaid: penaltyPaid.toNumber(),
                totalAmountPaid: totalAmountPaid.toNumber(),

                interestWaived: interestWaived.toNumber(),

                principalBal: principalBal.toNumber(),
                interestBal: interestBal.toNumber(),
                totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
                penaltyBal: penaltyBal.toNumber(),
                totalAmountBal: totalAmountBal.toNumber(),
                status: status
            };

            schedulePaid.push(detailPaid);

            // Check tmpAmountPaid
            if (tmpAmountPaid.isZero()) {
                break;
            }
        }

    } // End for-loop of schedule due

    // Check schedule next
    if (tmpAmountPaid.greaterThan(0)) {

        for (let o of scheduleNext) {
            if (tmpAmountPaid > 0) {
                let currentDue = o.currentDue;

                // Check amount paid
                let principalPaid = new BigNumber(0),
                    interestPaid = new BigNumber(0),
                    interestWaived = new BigNumber(0);

                if (tmpAmountPaid.lessThanOrEqualTo(currentDue.interest)) {
                    // interestPaid = tmpAmountPaid;
                    interestWaived = new BigNumber(currentDue.interest).minus(tmpAmountPaid);
                    tmpAmountPaid = new BigNumber(0);
                } else {
                    // interestPaid = new BigNumber(currentDue.interest);
                    interestWaived = new BigNumber(currentDue.interest);
                    tmpAmountPaid = tmpAmountPaid.minus(interestWaived);

                    // Check principal
                    // if (tmpAmountPaid.lessThanOrEqualTo(currentDue.principal)) {
                    //     principalPaid = tmpAmountPaid;
                    //     tmpAmountPaid = new BigNumber(0);
                    // } else {
                    //     principalPaid = new BigNumber(currentDue.principal);
                    //     tmpAmountPaid = tmpAmountPaid.minus(principalPaid);
                    // }
                }

                // Push data
                let totalPrincipalInterestPaid = principalPaid.plus(interestPaid),
                    totalAmountPaid = totalPrincipalInterestPaid,
                    principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
                    interestBal = new BigNumber(currentDue.interest).minus(interestPaid).minus(interestWaived),
                    totalPrincipalInterestBal = principalBal.plus(interestBal),
                    penaltyBal = 0,
                    totalAmountBal = totalPrincipalInterestBal;

                let status = 'Partial';
                if (totalPrincipalInterestBal.isZero()) {
                    status = 'Complete';
                }


                // Total schedule paid
                totalSchedulePaid = {
                    principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
                    interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
                    totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
                    penaltyDue: 0,
                    totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

                    principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
                    interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
                    totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
                    penaltyPaid: 0,
                    totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

                    interestWaived: totalSchedulePaid.interestWaived.plus(interestWaived),

                    principalBal: totalSchedulePaid.principalBal.plus(principalBal),
                    interestBal: totalSchedulePaid.interestBal.plus(interestBal),
                    totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
                    penaltyBal: 0,
                    totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
                };

                // Update repaidDoc
                let detailPaid = {
                    scheduleId: o._id,
                    installment: o.installment,
                    repaidDate: repaidDate,
                    numOfDayLate: currentDue.numOfDayLate,

                    principalDue: currentDue.principal,
                    interestDue: currentDue.interest,
                    totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
                    penaltyDue: currentDue.penalty,
                    totalAmountDue: currentDue.totalAmount,

                    principalPaid: principalPaid.toNumber(),
                    interestPaid: interestPaid.toNumber(),
                    totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
                    penaltyPaid: 0,
                    totalAmountPaid: totalAmountPaid.toNumber(),

                    interestWaived: interestWaived.toNumber(),

                    principalBal: principalBal.toNumber(),
                    interestBal: interestBal.toNumber(),
                    totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
                    penaltyBal: 0,
                    totalAmountBal: totalAmountBal.toNumber(),
                    status: status
                };

                schedulePaid.push(detailPaid);

                // Check tmpAmountPaid
                if (tmpAmountPaid.isZero()) {
                    break;
                }
            }

        } // End for-loop of schedule next

    }


    // Convert BigNumber of totalSchedulePaid
    totalSchedulePaid = {
        principalDue: totalSchedulePaid.principalDue.toNumber(),
        interestDue: totalSchedulePaid.interestDue.toNumber(),
        totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.toNumber(),
        penaltyDue: 0,
        totalAmountDue: totalSchedulePaid.totalAmountDue.toNumber(),

        principalPaid: totalSchedulePaid.principalPaid.toNumber(),
        interestPaid: totalSchedulePaid.interestPaid.toNumber(),
        totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.toNumber(),
        penaltyPaid: 0,
        totalAmountPaid: totalSchedulePaid.totalAmountPaid.toNumber(),

        interestWaived: totalSchedulePaid.interestWaived.toNumber(),

        principalBal: totalSchedulePaid.principalBal.toNumber(),
        interestBal: totalSchedulePaid.interestBal.toNumber(),
        totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.toNumber(),
        penaltyBal: 0,
        totalAmountBal: totalSchedulePaid.totalAmountBal.toNumber()
    };

    return {
        schedulePaid: schedulePaid,
        totalSchedulePaid: totalSchedulePaid
    };
};

MakeRepayment.close = function ({repaidDate, amountPaid, penaltyPaid, scheduleDue, scheduleNext, closing, principalUnpaid, feeOnPaymentUnPaid, totalScheduleDue, opts}) {
    new SimpleSchema({
        repaidDate: {
            type: Date
        },
        amountPaid: {
            type: Number,
            decimal: true,
            min: 0.01
        },
        penaltyPaid: {
            type: Number,
            decimal: true,
            min: 0,
            optional: true
        },
        scheduleDue: {
            type: Array,
            min: 0
        },
        'scheduleDue.$': {
            type: Object,
            blackbox: true,
            optional: true
        },
        scheduleNext: {
            type: Array,
            min: 0
        },
        'scheduleNext.$': {
            type: Object,
            blackbox: true,
            optional: true
        },
        closing: {
            type: Object,
            blackbox: true
        },
        principalUnpaid: {
            type: Number,
            decimal: true,
            blackbox: true,
            optional: true
        },
        feeOnPaymentUnPaid: {
            type: Number,
            decimal: true,
            blackbox: true,
            optional: true
        },
        totalScheduleDue: {
            type: Object,
            decimal: true,
            blackbox: true,
            optional: true
        },
        opts: {
            type: Object,
            optional: true,
            blackbox: true
        }
    }).validate({
        repaidDate,
        amountPaid,
        penaltyPaid,
        scheduleDue,
        scheduleNext,
        closing,
        principalUnpaid,
        feeOnPaymentUnPaid,
        totalScheduleDue,
        opts
    });

    //---------------------------
    // Total schedule paid
    let schedulePaid = [];
    let totalSchedulePaid = {
        principalDue: new BigNumber(0),
        interestDue: new BigNumber(0),
        feeOnPaymentDue: new BigNumber(0),
        totalPrincipalInterestDue: new BigNumber(0),
        penaltyDue: new BigNumber(0),
        totalAmountDue: new BigNumber(0),

        principalPaid: new BigNumber(0),
        interestPaid: new BigNumber(0),
        feeOnPaymentPaid: new BigNumber(0),
        totalPrincipalInterestPaid: new BigNumber(0),
        penaltyPaid: new BigNumber(0),
        totalAmountPaid: new BigNumber(0),

        interestWaived: new BigNumber(0),
        feeOnPaymentWaived: new BigNumber(0),

        principalBal: new BigNumber(0),
        interestBal: new BigNumber(0),
        feeOnPaymentBal: new BigNumber(0),
        totalPrincipalInterestBal: new BigNumber(0),
        penaltyBal: new BigNumber(0),
        totalAmountBal: new BigNumber(0)
    };


    let amountPaidCal = amountPaid;
    let principalPaidCal = amountPaidCal > principalUnpaid ? principalUnpaid : amountPaid;
    amountPaidCal = amountPaid - principalUnpaid > 0 ? amountPaid - principalUnpaid : 0;
    closing.interestReminderPenalty = amountPaidCal - closing.interestReminderPenalty > 0 ? closing.interestReminderPenalty : amountPaidCal;

    amountPaidCal = amountPaidCal - closing.interestReminderPenalty > 0 ? amountPaidCal - closing.interestReminderPenalty : 0;


    let interestCalTmp = new BigNumber(amountPaidCal).minus(totalScheduleDue.interestDue).minus(closing.interestAddition);
    let interestCal = interestCalTmp > 0 ? new BigNumber(totalScheduleDue.interestDue).plus(closing.interestAddition) : new BigNumber(amountPaidCal);
    amountPaidCal = amountPaidCal - totalScheduleDue.interestDue - closing.interestAddition > 0 ? amountPaidCal - totalScheduleDue.interestDue - closing.interestAddition : 0;
    let feeOnPaymentCal = amountPaidCal > 0 ? amountPaidCal : 0;

    let tmpAmountPaid = {
        principal: new BigNumber(principalPaidCal),
        feeOnPayment: new BigNumber(feeOnPaymentCal),
        interest: interestCal
    };
    let tmpPenaltyPaid = new BigNumber(penaltyPaid);

    // Check schedule due

    for (let o of scheduleDue) {
        let currentDue = o.currentDue;


        let principalPaid = new BigNumber(0),
            interestPaid = new BigNumber(0),
            feeOnPaymentPaid = new BigNumber(0),
            feeOnPaymentWaived = new BigNumber(0),
            interestWaived = new BigNumber(0);


        //Check Fee On Payment Paid
        if (tmpAmountPaid.feeOnPayment.lessThanOrEqualTo(currentDue.feeOnPayment)) {
            feeOnPaymentPaid = tmpAmountPaid.feeOnPayment;
            feeOnPaymentWaived = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid);
            tmpAmountPaid.feeOnPayment = new BigNumber(0);
        } else {
            feeOnPaymentPaid = new BigNumber(currentDue.feeOnPayment);
            tmpAmountPaid.feeOnPayment = tmpAmountPaid.feeOnPayment.minus(feeOnPaymentPaid);
        }


        // Check interest paid


        if (tmpAmountPaid.interest.lessThanOrEqualTo(currentDue.interest)) {
            interestPaid = tmpAmountPaid.interest;
            interestWaived = new BigNumber(currentDue.interest).minus(interestPaid);
            tmpAmountPaid.interest = new BigNumber(0);
        } else {
            interestPaid = new BigNumber(currentDue.interest);
            tmpAmountPaid.interest = tmpAmountPaid.interest.minus(interestPaid);
        }

        // Check principal paid
        if (tmpAmountPaid.principal.lessThanOrEqualTo(currentDue.principal)) {
            principalPaid = tmpAmountPaid.principal;
            tmpAmountPaid.principal = new BigNumber(0);
        } else {
            principalPaid = new BigNumber(currentDue.principal);
            tmpAmountPaid.principal = tmpAmountPaid.principal.minus(principalPaid);
        }


        // Check penalty paid
        let penaltyPaid = new BigNumber(0);

        if (tmpPenaltyPaid.greaterThan(0)) {
            if (tmpPenaltyPaid.lessThanOrEqualTo(currentDue.penalty)) {
                penaltyPaid = tmpPenaltyPaid;
                tmpPenaltyPaid = new BigNumber(0);
            } else {
                penaltyPaid = new BigNumber(currentDue.penalty);
                tmpPenaltyPaid = tmpPenaltyPaid.minus(penaltyPaid);
            }
        }

        // Data push to schedule paid
        let totalPrincipalInterestPaid = principalPaid.plus(interestPaid.plus(feeOnPaymentPaid)),
            totalAmountPaid = totalPrincipalInterestPaid.plus(penaltyPaid),


            principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
            interestBal = new BigNumber(currentDue.interest).minus(interestPaid).minus(interestWaived),
            feeOnPaymentBal = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid).minus(feeOnPaymentWaived),
            totalPrincipalInterestBal = principalBal.plus(interestBal).plus(feeOnPaymentBal),
            penaltyBal = new BigNumber(currentDue.penalty).minus(penaltyPaid),
            totalAmountBal = totalPrincipalInterestBal.plus(penaltyBal);

        // Total schedule paid
        totalSchedulePaid = {
            principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
            interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
            feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.plus(currentDue.feeOnPayment),
            totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
            penaltyDue: totalSchedulePaid.penaltyDue.plus(currentDue.penalty),
            totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

            principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
            interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
            feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.plus(feeOnPaymentPaid),
            totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
            penaltyPaid: totalSchedulePaid.penaltyPaid.plus(penaltyPaid),
            totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

            interestWaived: totalSchedulePaid.interestWaived.plus(interestWaived),
            feeOnPaymentWaived: totalSchedulePaid.feeOnPaymentWaived.plus(feeOnPaymentWaived),

            principalBal: totalSchedulePaid.principalBal.plus(principalBal),
            interestBal: totalSchedulePaid.interestBal.plus(interestBal),
            feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.plus(feeOnPaymentBal),
            totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
            penaltyBal: totalSchedulePaid.penaltyBal.plus(penaltyBal),
            totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
        };

        // Update repaidDoc
        let detailPaid = {
            scheduleId: o._id,
            installment: o.installment,
            repaidDate: repaidDate,
            numOfDayLate: currentDue.numOfDayLate,

            principalDue: currentDue.principal,
            interestDue: currentDue.interest,
            feeOnPaymentDue: currentDue.feeOnPayment,
            totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
            penaltyDue: currentDue.penalty,
            totalAmountDue: currentDue.totalAmount,

            principalPaid: principalPaid.toNumber(),
            interestPaid: interestPaid.toNumber(),
            feeOnPaymentPaid: feeOnPaymentPaid.toNumber(),
            totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
            penaltyPaid: penaltyPaid.toNumber(),
            totalAmountPaid: totalAmountPaid.toNumber(),

            interestWaived: interestWaived.toNumber(),
            feeOnPaymentWaived: feeOnPaymentWaived.toNumber(),

            principalBal: principalBal.toNumber(),
            interestBal: interestBal.toNumber(),
            feeOnPaymentBal: feeOnPaymentBal.toNumber(),
            totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
            penaltyBal: penaltyBal.toNumber(),
            totalAmountBal: totalAmountBal.toNumber(),
            status: 'Complete'
        };

        schedulePaid.push(detailPaid);

        // Check tmpAmountPaid
        // if (tmpAmountPaid.isZero() && tmpPenaltyPaid.isZero()) {
        //     break;
        // }

    } // End for-loop of schedule due

    // Check schedule next
    for (let o of scheduleNext) {
        let currentDue = o.currentDue;

        let principalPaid = new BigNumber(0),
            interestPaid = new BigNumber(0),
            feeOnPaymentPaid = new BigNumber(0),
            feeOnPaymentWaived = new BigNumber(0),
            interestWaived = new BigNumber(0);

        // Check interest paid
        if (tmpAmountPaid.interest.lessThanOrEqualTo(currentDue.interest)) {
            interestPaid = tmpAmountPaid.interest;
            interestWaived = new BigNumber(currentDue.interest).minus(interestPaid);
            tmpAmountPaid.interest = new BigNumber(0);
        } else {
            interestPaid = new BigNumber(currentDue.interest);
            tmpAmountPaid.interest = tmpAmountPaid.interest.minus(interestPaid);
        }

        // interestWaived = new BigNumber(currentDue.interest);

        // feeOnPaymentWaived = new BigNumber(currentDue.feeOnPayment);


        //Check Fee On Payment Paid
        if (tmpAmountPaid.feeOnPayment.lessThanOrEqualTo(currentDue.feeOnPayment)) {
            feeOnPaymentPaid = tmpAmountPaid.feeOnPayment;
            feeOnPaymentWaived = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid);
            tmpAmountPaid.feeOnPayment = new BigNumber(0);
        } else {
            feeOnPaymentPaid = new BigNumber(currentDue.feeOnPayment);
            tmpAmountPaid.feeOnPayment = tmpAmountPaid.feeOnPayment.minus(feeOnPaymentPaid);
        }


        // Check principal paid
        if (tmpAmountPaid.principal.lessThanOrEqualTo(currentDue.principal)) {
            principalPaid = tmpAmountPaid.principal;
            tmpAmountPaid.principal = new BigNumber(0);
        } else {
            principalPaid = new BigNumber(currentDue.principal);
            tmpAmountPaid.principal = tmpAmountPaid.principal.minus(principalPaid);
        }
        
        // Push data
        let totalPrincipalInterestPaid = principalPaid.plus(interestPaid).plus(feeOnPaymentPaid),
            totalAmountPaid = totalPrincipalInterestPaid,
            principalBal = new BigNumber(currentDue.principal).minus(principalPaid),
            interestBal = new BigNumber(currentDue.interest).minus(interestPaid).minus(interestWaived),
            feeOnPaymentBal = new BigNumber(currentDue.feeOnPayment).minus(feeOnPaymentPaid).minus(feeOnPaymentWaived),

            totalPrincipalInterestBal = principalBal.plus(interestBal).plus(feeOnPaymentBal),
            penaltyBal = 0,
            totalAmountBal = totalPrincipalInterestBal;


        // Total schedule paid
        totalSchedulePaid = {
            principalDue: totalSchedulePaid.principalDue.plus(currentDue.principal),
            interestDue: totalSchedulePaid.interestDue.plus(currentDue.interest),
            feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.plus(currentDue.feeOnPayment),
            totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.plus(currentDue.totalPrincipalInterest),
            penaltyDue: totalSchedulePaid.penaltyDue.plus(currentDue.penalty),
            totalAmountDue: totalSchedulePaid.totalAmountDue.plus(currentDue.totalAmount),

            principalPaid: totalSchedulePaid.principalPaid.plus(principalPaid),
            interestPaid: totalSchedulePaid.interestPaid.plus(interestPaid),
            feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.plus(feeOnPaymentPaid),
            totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.plus(totalPrincipalInterestPaid),
            penaltyPaid: totalSchedulePaid.penaltyPaid.plus(0),
            totalAmountPaid: totalSchedulePaid.totalAmountPaid.plus(totalAmountPaid),

            interestWaived: totalSchedulePaid.interestWaived.plus(interestWaived),
            feeOnPaymentWaived: totalSchedulePaid.feeOnPaymentWaived.plus(feeOnPaymentWaived),

            principalBal: totalSchedulePaid.principalBal.plus(principalBal),
            interestBal: totalSchedulePaid.interestBal.plus(interestBal),
            feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.plus(feeOnPaymentBal),
            totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.plus(totalPrincipalInterestBal),
            penaltyBal: totalSchedulePaid.penaltyBal.plus(0),
            totalAmountBal: totalSchedulePaid.totalAmountBal.plus(totalAmountBal)
        };

        // Update repaidDoc
        let detailPaid = {
            scheduleId: o._id,
            installment: o.installment,
            repaidDate: repaidDate,
            numOfDayLate: currentDue.numOfDayLate,

            principalDue: currentDue.principal,
            interestDue: currentDue.interest,
            feeOnPaymentDue: currentDue.feeOnPayment,
            totalPrincipalInterestDue: currentDue.totalPrincipalInterest,
            penaltyDue: currentDue.penalty,
            totalAmountDue: currentDue.totalAmount,

            principalPaid: principalPaid.toNumber(),
            interestPaid: interestPaid.toNumber(),
            feeOnPaymentPaid: feeOnPaymentPaid.toNumber(),
            totalPrincipalInterestPaid: totalPrincipalInterestPaid.toNumber(),
            penaltyPaid: 0,
            totalAmountPaid: totalAmountPaid.toNumber(),

            interestWaived: interestWaived.toNumber(),
            feeOnPaymentWaived: feeOnPaymentWaived.toNumber(),

            principalBal: principalBal.toNumber(),
            interestBal: interestBal.toNumber(),
            feeOnPaymentBal: feeOnPaymentBal.toNumber(),
            totalPrincipalInterestBal: totalPrincipalInterestBal.toNumber(),
            penaltyBal: 0,
            totalAmountBal: totalAmountBal.toNumber(),
            status: 'Complete'
        };

        schedulePaid.push(detailPaid);

        // Check tmpAmountPaid
        // if (tmpAmountPaid.isZero()) {
        //     break;
        // }

    } // End for-loop of schedule next

    // Convert BigNumber of totalSchedulePaid
    totalSchedulePaid = {
        principalDue: totalSchedulePaid.principalDue.toNumber(),
        interestDue: totalSchedulePaid.interestDue.toNumber(),
        feeOnPaymentDue: totalSchedulePaid.feeOnPaymentDue.toNumber(),
        totalPrincipalInterestDue: totalSchedulePaid.totalPrincipalInterestDue.toNumber(),
        penaltyDue: totalSchedulePaid.penaltyDue.toNumber(),
        totalAmountDue: totalSchedulePaid.totalAmountDue.toNumber(),

        principalPaid: totalSchedulePaid.principalPaid.toNumber(),
        interestPaid: totalSchedulePaid.interestPaid.toNumber(),
        feeOnPaymentPaid: totalSchedulePaid.feeOnPaymentPaid.toNumber(),
        totalPrincipalInterestPaid: totalSchedulePaid.totalPrincipalInterestPaid.toNumber(),
        penaltyPaid: totalSchedulePaid.penaltyPaid.toNumber(),
        totalAmountPaid: totalSchedulePaid.totalAmountPaid.toNumber(),

        interestWaived: totalSchedulePaid.interestWaived.toNumber(),
        feeOnPaymentWaived: totalSchedulePaid.feeOnPaymentWaived.toNumber(),

        principalBal: totalSchedulePaid.principalBal.toNumber(),
        interestBal: totalSchedulePaid.interestBal.toNumber(),
        feeOnPaymentBal: totalSchedulePaid.feeOnPaymentBal.toNumber(),
        totalPrincipalInterestBal: totalSchedulePaid.totalPrincipalInterestBal.toNumber(),
        penaltyBal: totalSchedulePaid.penaltyBal.toNumber(),
        totalAmountBal: totalSchedulePaid.totalAmountBal.toNumber()
    };


    return {
        schedulePaid: schedulePaid,
        totalSchedulePaid: totalSchedulePaid
    };
};


MakeRepayment.writeOff = function ({repaidDate, amountPaid, loanAccDoc, opts}) {
    new SimpleSchema({
        repaidDate: {
            type: Date
        },
        amountPaid: {
            type: Number,
            decimal: true,
            min: 0.01
        },
        loanAccDoc: {
            type: Object,
            optional: true,
            blackbox: true
        },

        opts: {
            type: Object,
            optional: true,
            blackbox: true
        }
    }).validate({
        repaidDate,
        amountPaid,
        loanAccDoc,
        opts
    });
    let objPayment = {};
    let paymentWriteOff = loanAccDoc.paymentWriteOff;

    objPayment.rePaidDate = repaidDate;

    if (opts.outStanding.feeOnPayment > 0) {
        if (opts.outStanding.feeOnPayment >= amountPaid) {
            objPayment.unPaidFeeOnPayment = opts.outStanding.feeOnPayment - amountPaid;
            objPayment.feeOnPayment = amountPaid;
            amountPaid = 0;
        } else {
            objPayment.unPaidFeeOnPayment = 0;
            objPayment.feeOnPayment = opts.outStanding.feeOnPayment;
            amountPaid = amountPaid - opts.outStanding.feeOnPayment;
        }

    }

    if (opts.outStanding.interest > 0) {
        if (opts.outStanding.interest >= amountPaid) {
            objPayment.unPaidInterest = opts.outStanding.interest - amountPaid;
            objPayment.unPaidPrincipal = opts.outStanding.amount;

            objPayment.amount = 0;
            objPayment.interest = amountPaid;
        } else {
            objPayment.unPaidInterest = 0;
            objPayment.unPaidPrincipal = opts.outStanding.amount - (amountPaid - opts.outStanding.interest);

            objPayment.amount = amountPaid - opts.outStanding.interest;
            objPayment.interest = opts.outStanding.interest;
        }
    } else {
        objPayment.unPaidInterest = 0;
        objPayment.unPaidPrincipal = opts.outStanding.amount - amountPaid;

        objPayment.amount = amountPaid;
        objPayment.interest = 0;
    }

    paymentWriteOff.push(objPayment);
    return paymentWriteOff;
};



