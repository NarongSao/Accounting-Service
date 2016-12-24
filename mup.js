module.exports = {
 servers: {
   one: {
     host: '35.165.82.225',
     username: 'ubuntu',
     pem: "/home/rabbit/Downloads/microfis.pem"
     // password:
     // or leave blank for authenticate from ssh-agent
   }
 },

 meteor: {
   name: 'microfis',
   path: '../microfis',
   servers: {
     one: {}
   },
   buildOptions: {
     serverOnly: true,
   },
   env: {
     ROOT_URL: 'http://35.165.82.225',
     MONGO_URL: 'mongodb://localhost/microfis',
     TZ: 'Asia/Bangkok'	
   },
   dockerImage: 'abernix/meteord:base',
   deployCheckWaitTime: 60
 },

 mongo: {
   oplog: true,
   port: 27017,
   env: {
     TZ: 'Asia/Bangkok'	
   },
   servers: {
     one: {},
   },

 },
};
