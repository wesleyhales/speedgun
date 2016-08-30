#!/bin/sh

args=("$@")
SERVER_MODE=${args[0]}

echo "running Speedgun.io in $SERVER_MODE mode"

pushd ./data/postgres > /dev/null
    docker rm -f sg-postgres-name
#    docker build -t sg-postgres .
    docker pull wesleyhales/speedgun-postgres
    docker run -d -P --restart=always -v /home/speedgun/postgres/data:/var/lib/postgresql/data -p 5432:5432 --name sg-postgres-name wesleyhales/speedgun-postgres sh -c "./docker-entrypoint.sh postgres"
    #docker run -d -P --restart=always -v /Users/speedgun/postgres/data:/var/lib/postgresql/data -p 5432:5432 --name sg-postgres-name 549907d445d1 sh -c "./docker-entrypoint.sh postgres"
popd > /dev/null

if [ "$SERVER_MODE" = "dev" ]; then
  #dev
  #pushd ./server > /dev/null
      #cp -rf server/Dockerfile-dev Dockerfile &&
      docker rm -f sg-server-name
      docker build -t sg-server -f server/Dockerfile-dev .
       #you need to build to /Users/speedgun/server/target/speedgun
      docker run -d -P --restart=always -v /Users/whales/dev/speedgun/server/target/speedgun:/root/target/speedgun -v /Users/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 8081:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
  #popd > /dev/null
elif [ "$SERVER_MODE" = "build" ]; then
   pushd ./server > /dev/null
     cp -rf Dockerfile-prod Dockerfile &&
     docker rm -f sg-server-name
     docker build -t sg-server .
     docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 8081:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
   popd > /dev/null
elif [ "$SERVER_MODE" = "buildprod" ]; then
   pushd ./server > /dev/null
     cp -rf Dockerfile-prod Dockerfile &&
     docker rm -f sg-server-name
     docker build -t sg-server .
     docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
popd > /dev/null
elif [ "$SERVER_MODE" = "pullprod" ]; then
   pushd ./server > /dev/null
     docker rm -f sg-server-name
     docker pull wesleyhales/speedgun-server
     docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn wesleyhales/speedgun-server -c "./server-entrypoint.sh"
popd > /dev/null
else
  #prod or local
  pushd ./server > /dev/null
    docker rm -f sg-server-name
    docker pull wesleyhales/speedgun-server
    docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 8081:8080 --name sg-server-name --link sg-postgres-name:spn wesleyhales/speedgun-server sh -c "./server-entrypoint.sh"
  popd > /dev/null
fi

#jump into running container
#docker exec -ti sg-server-name /bin/bash

#export to CSV from sg-server-name postgres client
#psql -h ${SPN_PORT_5432_TCP_ADDR} -p 5432 -U postgres
#\c speedgun
#\COPY jsontest to 'jsontest.csv' DELIMITER ',' CSV HEADER;
#or...
#select count(*) from jsontest; for total records
#or..
#fish out by copying to a shared dir i.e. jboss/standalone/log/
