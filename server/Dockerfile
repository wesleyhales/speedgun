FROM ubuntu:14.04

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
  echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections && \
  add-apt-repository -y ppa:webupd8team/java && \
  apt-get update && \
  apt-get install -y oracle-java7-installer && \
  rm -rf /var/lib/apt/lists/*

# Install Phantom2 build requirements
RUN \
  sudo apt-get update && apt-get -y install g++ flex bison gperf ruby perl \
  libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev libjpeg-dev libqt5webkit5-dev

RUN rm -rf phantomjs

RUN git clone git://github.com/ariya/phantomjs.git

RUN cd /root/phantomjs/ && ./build.sh --confirm

RUN ln -s /root/phantomjs/bin/phantomjs /usr/bin/phantomjs

#ADD data tmp2

EXPOSE 3306 8080 8443

RUN git clone git://github.com/wesleyhales/speedgun.git

#RUN mkdir /root/speedgun/core/reports

#VOLUME ["/root/speedgun/core/reports"]

RUN cd speedgun/core && phantomjs --ssl-protocol=any --ignore-ssl-errors=yes speedgun.js http://www.google.com performance csv

#Install MYSQL
RUN \
  sudo apt-get update && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get install -y mysql-server-5.6 && \
  rm -rf /var/lib/apt/lists/* && \
  sed -i 's/^\(bind-address\s.*\)/# \1/' /etc/mysql/my.cnf && \
  sed -i 's/^\(log_error\s.*\)/# \1/' /etc/mysql/my.cnf && \
  echo "mysqld_safe &" > /tmp/config && \
  echo "mysqladmin --silent --wait=30 ping || exit 1" >> /tmp/config && \
  echo "mysql -e 'GRANT ALL PRIVILEGES ON *.* TO \"root\"@\"%\" WITH GRANT OPTION;'" >> /tmp/config && \
  echo "mysql -e 'CREATE database fluxui;'" >> /tmp/config && \
  echo "mysql -e 'CREATE USER \"fluxui\"@\"localhost\" IDENTIFIED BY \"fluxui123\";'" >> /tmp/config && \
  echo "mysql -e 'GRANT ALL PRIVILEGES ON fluxui.* TO \"fluxui\"@\"localhost\" WITH GRANT OPTION;'" >> /tmp/config && \
  bash /tmp/config && \
  rm -f /tmp/config

#this is an alternative http://txt.fliglio.com/2013/11/creating-a-mysql-docker-container/
#CMD ["/bin/bash", "/opt/mysql.sh"]

# Define default command.
CMD ["mysqld_safe"]

#ADD server.tar /root/server.tar
RUN cd /root && wget https://www.dropbox.com/s/824hh0sv0nsejhj/server.tar

RUN cd /root && tar -xzvf server.tar

RUN echo "sudo /etc/init.d/mysql start && \n cd /root/jboss-as-7.1.1.Final-fluxui/ && sudo ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0" >> /root/.bashrc

# install maven
RUN sudo apt-get update && apt-get install -y maven

ADD src /root/src
ADD pom.xml /root/pom.xml

RUN mvn clean install

RUN cp -rf /root/target/speedgun.war /root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/

# Cleanup old JMS queue
RUN rm -rf /root/jboss-as-7.1.1.Final-fluxui/standalone/tmp/ /root/jboss-as-7.1.1.Final-fluxui/standalone/data/*

RUN mkdir /root/jboss-as-7.1.1.Final-fluxui/speedgun
RUN cd /root/jboss-as-7.1.1.Final-fluxui/speedgun && curl -O https://raw.githubusercontent.com/wesleyhales/speedgun/master/core/speedgun.js
RUN cd /root/jboss-as-7.1.1.Final-fluxui/speedgun && curl -O https://raw.githubusercontent.com/wesleyhales/speedgun/master/core/config.json

# Define mountable directories.
#VOLUME ["/etc/mysql", "/var/lib/mysql"]

# Define working directory.
#WORKDIR /data

# Define default command.
#CMD ["mysqld_safe"]

# Expose ports.
#EXPOSE 3306

# install maven
#RUN apt-get install -y maven

# run terminal
CMD ["/bin/bash"]

#RUN yum -y install wget
#RUN wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/7u65-b17/jre-7u65-linux-x64.rpm
#RUN echo "cca8862e49cf2e6c6e28e1987c59a2f7  jre-7u65-linux-x64.rpm" >> MD5SUM
#RUN md5sum -c MD5SUM
#RUN rpm -Uvh jre-7u65-linux-x64.rpm
#RUN rm -f jre-7u65-linux-x64.rpm MD5SUM