#!/usr/bin/env bash

args=("$@")
DOMAIN=${args[0]}
OVERRIDE=${args[1]}

COUNTER=0
while [  $COUNTER -lt 5 ]; do
   echo The counter is $COUNTER
   let COUNTER=COUNTER+1
   phantomjs --config=pconfig.json speedgun.js $DOMAIN -o csv $OVERRIDE --screenshot > $DOMAIN_headers.txt
   sleep 5
done

