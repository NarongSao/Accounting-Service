module.exports = {
  servers: {
    one: {
      // TODO: set host address, username, and authentication method
      host: '172.104.171.83',
      username: 'root',
      // pem: './path/to/pem'
      password: 'rabbit$2017$'
      // or neither for authenticate from ssh-agent
    }
  },

  meteor: {
    // TODO: change app name and path
    name: 'microfis-makara',
    path: '../microfis',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      // TODO: Change to your app's url
      // If you are using ssl, it needs to start with https://
      ROOT_URL: 'http://172.104.171.83',
      MONGO_URL: 'mongodb://localhost/makara-db'
    },


    // This is the maximum time in seconds it will wait
    // for your app to start
    // Add 30 seconds if the server has 512mb of ram
    // And 30 more if you have binary npm dependencies.
    deployCheckWaitTime: 60,
    docker: {
	image: 'abernix/meteord:base',
	args: ["-v /etc/timezone:/etc/timezone","-v /etc/localtime:/etc/localtime"]
	},

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: false
  },

  mongo: {
    oplog: true,
    port: 27017,
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
