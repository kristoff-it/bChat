# Use phusion/passenger-full as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/passenger-docker/blob/master/Changelog.md for
# a list of version numbers.
# FROM phusion/passenger-full:<VERSION>
# Or, instead of the 'full' variant, use one of these:
#FROM phusion/passenger-ruby19:<VERSION>
#FROM phusion/passenger-ruby20:<VERSION>
#FROM phusion/passenger-ruby21:<VERSION>
# FROM phusion/passenger-nodejs:<VERSION>
FROM phusion/passenger-customizable:0.9.14

# Set correct environment variables.
ENV HOME /root
# Temp fix for passenger 4 regarding restart of processes with websocket connections:
ENV _PASSENGER_NODE_CONTROL_SERVER 1

# Use baseimage-docker's init process.
CMD ["/sbin/my_init"]

# If you're using the 'customizable' variant, you need to explicitly opt-in
# for features. Uncomment the features you want:
#
#   Build system and git.
RUN /build/utilities.sh
#   Ruby support.
#RUN /build/ruby1.9.sh
#RUN /build/ruby2.0.sh
#RUN /build/ruby2.1.sh
#   Python support.
#RUN /build/python.sh
#   Node.js and Meteor support.
RUN /build/nodejs.sh

# Setup REDIS:
RUN /build/redis.sh
RUN rm -f /etc/service/redis/down



# ...put your own build instructions here...

# Get bChat:
USER app
WORKDIR /home/app
RUN echo 1
RUN git clone https://1c8ed18a15cebbf96e47e059d98fdbfe336b0fb9@github.com/kappaloris/bChat.git

# Setup nginx:
USER root
WORKDIR /home/app/bChat
RUN rm -f /etc/service/nginx/down
RUN rm /etc/nginx/sites-enabled/default
RUN cp Docker/nginx-bchat.conf /etc/nginx/sites-enabled/bchat.conf

# Install nodejs deps:
# USER root
# RUN npm install -g googleapis@0.7.0 redis@0.10.1 request@2.34.0 socket.io@1.0.6
RUN npm install googleapis@0.7.0 redis@0.10.1 request@2.34.0 socket.io@1.0.6


# Muh key:
ADD ssh_key.pub /tmp/ssh_key.pub
RUN cat /tmp/ssh_key.pub >> /root/.ssh/authorized_keys && rm -f /tmp/ssh_key.pub

# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*