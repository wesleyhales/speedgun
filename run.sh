#!/bin/sh

pushd ./data/postgres > /dev/null
    docker rm -f sg-postgres-name
    docker build -t sg-postgres .
    #docker run --net=host --rm -P --name sg-postgres-name sg-postgres
    docker run -d -P --name sg-postgres-name sg-postgres sh -c "./docker-entrypoint.sh postgres"
popd > /dev/null




pushd ./server > /dev/null
    docker rm -f sg-server-name
    docker build -t sg-server .
    docker run -d -P -p 8081:8080 --name sg-server-name --link sg-postgres-name:spn sg-server sh -c "./server-entrypoint.sh"
popd > /dev/null

#docker run --net=host --rm -P --name sg-server-name sg-server

#TIMEOUT=10m
#echo "Running the container and triggering the tests (with ${TIMEOUT} timeout)..."
#echo "Shared volume in ${SOURCE_PATH}. Current directory is ${pwd}."
#timeout --signal=SIGKILL ${TIMEOUT} docker run -v $SOURCE_PATH:/source $CONTAINER sh -c "/source/container/build.sh"
##docker run -ti -p 9923:9923 -v $SOURCE_PATH:/source $CONTAINER /bin/bash
#echo "Finished with no error."
#echo