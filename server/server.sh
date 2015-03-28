#!/bin/sh
args=("$@")
SERVER_MODE=${args[0]}

vagrant up && vagrant ssh -c "echo $SERVER_MODE && cd /vagrant && ./run.sh $SERVER_MODE"