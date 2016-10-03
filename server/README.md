
### Notes
* run -ti === interactive mode, should be -d for prod server
* --net=host === allows use of host network stack.. otherwise no access
* http://localhost:8081/sg/beacon/init (init the RUM beacon)
* tag an image prepping for dockerhub: docker tag sg-server wesleyhales/speedgun-server
* systemd monitor: https://coreos.com/os/docs/latest/scheduling-tasks-with-systemd-timers.html

###Docker no sudo
sudo chmod +s /usr/bin/docker

###psql
docker exec -ti sg-server-name /bin/bash
psql -h ${SPN_PORT_5432_TCP_ADDR} -p 5432 -U postgres
