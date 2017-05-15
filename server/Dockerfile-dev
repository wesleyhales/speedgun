FROM debian:wheezy

MAINTAINER Wesley Hales <wesleyhales@gmail.com>

# Install.
RUN \
  sed -i 's/# \(.*multiverse$\)/\1/g' /etc/apt/sources.list && \
  apt-get update && \
  apt-get -y upgrade && \
  apt-get install -y build-essential && \
  apt-get install -y software-properties-common && \
  apt-get install -y byobu curl git htop man unzip vim wget && \
  rm -rf /var/lib/apt/lists/*

# Set environment variables.
ENV HOME /root

# Define working directory.
WORKDIR /root

# Install Java.
RUN \
  apt-get update && \
  apt-get install -y openjdk-7-jdk && \
  rm -rf /var/lib/apt/lists/*

# Define commonly used JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

# Install Phantom2 build requirements
RUN apt-get update && apt-get -y install g++ libfontconfig1-dev libjpeg-dev

##################################### build latest phantom

#RUN apt-get -y install python

#RUN rm -rf phantomjs

#RUN git clone git://github.com/ariya/phantomjs.git

#RUN cd /root/phantomjs/deploy && ./docker-build.sh

#RUN ln -s /root/phantomjs/bin/phantomjs /usr/bin/phantomjs
######################################+++++ END build latest phantom

######################################+++++ comment out when building new version of phantomjs

RUN curl -OLkv -A "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5" https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN mv phantomjs-2.1.1-linux-x86_64 /usr/local/share
RUN ln -sf /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin

######################################+++++ END comment out when building new version of phantomjs

RUN git clone git://github.com/wesleyhales/speedgun.git

#RUN mkdir /root/speedgun/core/reports

#VOLUME ["/root/speedgun/core/reports"]

RUN cd speedgun/core && phantomjs --ssl-protocol=any --ignore-ssl-errors=yes speedgun.js http://www.google.com performance csv

RUN cd /root && wget https://www.dropbox.com/s/k2iz3qttedm43s9/server.tar

RUN cd /root && tar -xvf server.tar

RUN mkdir /root/target

RUN ln -s /root/target/speedgun /root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/speedgun.war

RUN touch /root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/speedgun.war.dodeploy

# Cleanup old JMS queue
RUN rm -rf /root/jboss-as-7.1.1.Final-fluxui/standalone/tmp/ /root/jboss-as-7.1.1.Final-fluxui/standalone/data/*
RUN rm -rf /root/jboss-as-7.1.1.Final-fluxui/standalone/configuration/standalone_xml_history

RUN mkdir /root/jboss-as-7.1.1.Final-fluxui/speedgun
#todo2
COPY core/speedgun.js /root/jboss-as-7.1.1.Final-fluxui/speedgun/
COPY core/config.json /root/jboss-as-7.1.1.Final-fluxui/speedgun/
COPY core/pconfig.json /root/jboss-as-7.1.1.Final-fluxui/speedgun/

COPY server/server-entrypoint.sh /

VOLUME /root/jboss-as-7.1.1.Final-fluxui/standalone/log

ENTRYPOINT ["/server-entrypoint.sh"]

RUN apt-get update && apt-get install -y postgresql-client

COPY server/speedgun.sql /

EXPOSE 3306 8080 8443

#CMD ["postgres"]