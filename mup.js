module.exports = {
  servers: {
    one: {
      host: '35.163.117.31',
      username: 'ubuntu',
      pem: "/home/rabbit/Downloads/leang-pailin.pem"
      // password:
      // or leave blank for authenticate from ssh-agent
    }
  },

  meteor: {
    name: 'microfis',
    path: '../microfis',
    port: 4000,
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'http://35.163.117.31',
      MONGO_URL: 'mongodb://localhost/microfis'
    },
    dockerImage: 'abernix/meteord:base',
    deployCheckWaitTime: 60
  },

  mongo: {
    oplog: true,
    port: 27017,
    servers: {
      one: {},
    },
  },
};
