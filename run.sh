#!/bin/sh

pushd ./data/postgres > /dev/null
    docker rm -f sg-postgres-name
    docker build -t sg-postgres .
    #docker run --net=host --rm -P --name sg-postgres-name sg-postgres
    docker run -d -P -v /home/speedgun/postgres/data:/var/lib/postgresql/data -p 5432:5432 --name sg-postgres-name sg-postgres sh -c "./docker-entrypoint.sh postgres"
popd > /dev/null
#
pushd ./server > /dev/null
    docker rm -f sg-server-name
    docker build -t sg-server .
    docker run -d -P -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
popd > /dev/null

#the following is for fishing out the phantomjs binary built from source
#pushd ./server > /dev/null
#    docker rm -f sg-server-name
#    docker build -t sg-server .
#    docker run -d -P -p 80:8080  -v /vagrant/bin:/root/phantomjs2/ --link sg-postgres-name:spn sg-server
##    docker exec -ti "container name" /bin/bash
##cp -rf /root/phantomjs/bin/phantomjs /root/phantomjs2/
#popd > /dev/null

#jump into running container
#docker exec -ti sg-server-name /bin/bash