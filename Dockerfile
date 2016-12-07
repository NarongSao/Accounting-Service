# deploy/Dockerfile
# Dockerfile for pos.
# Change "kevin" in the Dockerfile to your app's name
FROM node:4.4.7
MAINTAINER Narong Sao <narongsao2015@gmail.com>
RUN apt-get install -y curl
RUN curl https://install.meteor.com/ | /bin/sh
# Change "Narong" to your app's name
ADD . /opt/rabbit/app
# Install NPM packages
WORKDIR /opt/rabbit/app/programs/server
RUN npm install
#Install yarn package (If you use Yarn )
#WORKDIR /opt/rabbit/app/programs/server
#RUN curl -o- -L https://yarnpkg.com/install.sh | bash
#RUN /bin/bash -c 'source $HOME/.bashrc'
#RUN /bin/bash -c 'yarn install'
#RUN yarn install

# Set environment variables
WORKDIR /opt/rabbit/app
ENV PORT 80
ENV ROOT_URL http://127.0.0.1
ENV MONGO_URL mongodb://localhost:27017/microfisdb
# Expose port 80
EXPOSE 80
# Start the app
CMD node ./main.js
