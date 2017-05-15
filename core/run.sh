#!/usr/bin/env bash

args=("$@")
TIMES=${args[0]}
DOMAIN=${args[1]}
OVERRIDE=${args[2]}

COUNTER=0
while [  $COUNTER -lt $TIMES ]; do
   echo The counter is $COUNTER
   let COUNTER=COUNTER+1
   ./phantomjs --config=pconfig.json speedgun.js $DOMAIN -o csv --cdnDebug --screenshot
   sleep 5
done

