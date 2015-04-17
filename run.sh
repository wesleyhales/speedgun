#!/bin/sh

args=("$@")
SERVER_MODE=${args[0]}

pushd ./data/postgres > /dev/null
    docker rm -f sg-postgres-name
#    docker build -t sg-postgres .
    docker pull wesleyhales/speedgun-postgres
    docker run -d -P --restart=always -v /home/speedgun/postgres/data:/var/lib/postgresql/data -p 5432:5432 --name sg-postgres-name wesleyhales/speedgun-postgres sh -c "./docker-entrypoint.sh postgres"
popd > /dev/null

if [ "$SERVER_MODE" = "dev" ]; then
  #dev
  echo "running in dev mode"
  pushd ./server > /dev/null
      cp -rf Dockerfile-dev Dockerfile &&
      docker rm -f sg-server-name
      docker build -t sg-server .
      docker run -d -P --restart=always -v /vagrant/server/target/speedgun:/root/target/speedgun -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
  popd > /dev/null
elif [ "$SERVER_MODE" = "build" ]; then
   echo "running in build mode"
   pushd ./server > /dev/null
     cp -rf Dockerfile-prod Dockerfile &&
     docker rm -f sg-server-name
     docker build -t sg-server .
     docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
     #docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 8081:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
   popd > /dev/null
else
  #prod
  echo "running in pull mode"
  pushd ./server > /dev/null
    docker rm -f sg-server-name
    docker pull wesleyhales/speedgun-server
    docker run -d -P --restart=always -v /home/speedgun/logs:/root/jboss-as-7.1.1.Final-fluxui/standalone/log -p 80:8080 --name sg-server-name --link sg-postgres-name:spn wesleyhales/speedgun-server sh -c "./server-entrypoint.sh"
  popd > /dev/null
fi

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
