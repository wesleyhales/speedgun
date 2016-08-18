FROM jenkins:latest

USER root

RUN echo "hello"

RUN cd /var/jenkins_home

RUN curl -OLkv -A "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5" https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN mv phantomjs-2.1.1-linux-x86_64 /usr/local/share
RUN ln -sf /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin

RUN apt-get update && apt-get install jq
RUN apt-get install curl

#build . -t jenkins_custom
#docker run -p 8080:8080 -p 50000:50000 -v /Users/whales/jenkins:/var/jenkins_home jenkins_custom