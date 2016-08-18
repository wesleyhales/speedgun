FROM ubuntu:15.04

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
# auto validate license
#RUN echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections

# Install Java.
RUN \
  apt-get update && \
  apt-get install -y openjdk-7-jdk && \
  rm -rf /var/lib/apt/lists/*

# Define commonly used JAVA_HOME variable
ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

# update repos
RUN echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | tee /etc/apt/sources.list.d/webupd8team-java.list
RUN echo "deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | tee -a /etc/apt/sources.list.d/webupd8team-java.list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys EEA14886
RUN apt-get update

# install java
RUN apt-get install oracle-java8-installer -y
RUN apt-get clean

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

#RUN echo "cd /root/jboss-as-7.1.1.Final-fluxui/ && ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0" >> /root/.bashrc

# install maven
RUN apt-get update && apt-get install -y maven

RUN cd /root/speedgun/server && mvn clean install

RUN ln -s /root/speedgun/server/target/speedgun /root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/speedgun.war

RUN touch /root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/speedgun.war.dodeploy

# Cleanup old JMS queue
RUN rm -rf /root/jboss-as-7.1.1.Final-fluxui/standalone/tmp/ /root/jboss-as-7.1.1.Final-fluxui/standalone/data/*
RUN rm -rf /root/jboss-as-7.1.1.Final-fluxui/standalone/configuration/standalone_xml_history

RUN mkdir /root/jboss-as-7.1.1.Final-fluxui/speedgun
RUN cd /root/jboss-as-7.1.1.Final-fluxui/speedgun && curl -O https://raw.githubusercontent.com/wesleyhales/speedgun/master/core/speedgun.js #v5
RUN cd /root/jboss-as-7.1.1.Final-fluxui/speedgun && curl -O https://raw.githubusercontent.com/wesleyhales/speedgun/master/core/config.json #v5
RUN cd /root/jboss-as-7.1.1.Final-fluxui/speedgun && curl -O https://raw.githubusercontent.com/wesleyhales/speedgun/master/core/pconfig.json #v5

COPY server-entrypoint.sh /

VOLUME /root/jboss-as-7.1.1.Final-fluxui/standalone/log

ENTRYPOINT ["/server-entrypoint.sh"]

RUN apt-get update

RUN apt-get install -y postgresql-client

COPY speedgun.sql /

EXPOSE 3306 8080 8443

#CMD ["postgres"]