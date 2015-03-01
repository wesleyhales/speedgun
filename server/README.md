## Running speedgun.io server locally

0. Install VirtualBox and Vagrant
1. Run: ```./server.sh```
2. If vagrant bombs out with this error: "Failed to mount folders in Linux guest. This is usually because the "vboxsf" file system is not available...." then run: ```./fix-virtualbox.sh```
3. After build is done, open your browser and go to http://localhost:8081

## Running speedgun.io server for development

0. Install VirtualBox and Vagrant
1. Install maven
2. Run: ```./server.sh dev```
3. If vagrant bombs out with this error: "Failed to mount folders in Linux guest. This is usually because the "vboxsf" file system is not available...." then run: ```./fix-virtualbox.sh```
4. After build is done, open your browser and go to http://localhost:8081
5. Note - To make changes to web resources like index.html, etc... you must make them in src/main/webapp then run ```mvn package``` to see the changes on the locally running server.


### Notes

* run -ti === interactive mode, should be -d for prod server
* --net=host === allows use of host network stack.. otherwise no access
* http://localhost:8081/rest/beacon/init (init the RUM beacon)
* tag an image prepping for dockerhub: docker tag sg-server wesleyhales/speedgun-server

### problems with vagrant:

####ref http://stackoverflow.com/questions/22717428/vagrant-error-failed-to-mount-folders-in-linux-guest

####ref https://gist.github.com/kazu69/4576d886089358ad61b0

###Docker no sudo
sudo chmod +s /usr/bin/docker

###psql
docker exec -ti sg-server-name /bin/bash
psql -h ${SPN_PORT_5432_TCP_ADDR} -p 5432 -U postgres
