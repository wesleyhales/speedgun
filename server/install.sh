#!/bin/sh
sudo rpm -iUvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo yum -y update
sudo yum -y install docker-io
echo "Docker is now installed as `which docker`"
docker --version