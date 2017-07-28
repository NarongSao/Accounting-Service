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
            'microfis_workingDay'
        ],
        data: [
            'microfis_creditOfficer'
        ]
    }
};


