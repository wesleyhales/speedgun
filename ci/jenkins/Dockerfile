FROM jenkins:latest

USER root

RUN echo "hello"

RUN cd /var/jenkins_home

RUN curl -OLk https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN mv phantomjs-2.1.1-linux-x86_64 /usr/local/share
RUN ln -sf /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin

RUN apt-get update && apt-get install jq
RUN apt-get install curl

#build . -t jenkins_custom
#docker run -p 8080:8080 -p 50000:50000 -v /Users/whales/jenkins:/var/jenkins_home jenkins_custom