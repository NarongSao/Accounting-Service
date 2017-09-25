Module = typeof Module === 'undefined' ? {} : Module;

Module.Microfis = {
    name: 'Microfis',
    version: '2.0.0',
    summary: 'Microfis Management System is ...',
    roles: [
        'setting',
        'data-insert',
        'data-update',
        'data-remove',
        'reporter',
        'admin-reporter'
    ],
    dump: {
        setting: [
            'microfis_holiday',
            'microfis_location',
            'microfis_lookupValue',
            'microfis_paymentStatus',
            'microfis_penalty',
            'microfis_penaltyClosing',
            'microfis_product',
            'microfis_productStatus',
            'microfis_savingProduct',
            'microfis_setting',
            'microfis_fee',
            'microfis_fund',
            'roles',
            'users'
        ],
        data: [
            'microfis_creditOfficer',
            'microfis_clearPrepay',
            'microfis_client',
            'microfis_endOfProcess',
            'microfis_group',
            'microfis_groupLoan',
            'microfis_loanAcc',
            'microfis_repayment',
            'microfis_repaymentSchedule',
            'microfis_savingAcc',
            'microfis_savingTransaction',
        ]
    }
};