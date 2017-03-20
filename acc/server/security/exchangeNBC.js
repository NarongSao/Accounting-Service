import {ExchangeNBC} from '../../imports/api/collections/exchangeNBC';
import './_init.js';

/**
 * Currency
 */

ExchangeNBC.permit(['insert'])
    .Acc_ifSuperOrAdmin()
    .allowInClientCode();
ExchangeNBC.permit(['update'])
    .Acc_ifSuperOrAdmin()
    .allowInClientCode();
ExchangeNBC.permit(['remove'])
    .Acc_ifSuperOrAdmin()
    .allowInClientCode();
