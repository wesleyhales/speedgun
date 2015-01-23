#!/bin/sh
psql -h $SPN_PORT_5432_TCP_ADDR -p $SPN_PORT_5432_TCP_PORT -U postgres -f /speedgun.sql &&
cd /root/jboss-as-7.1.1.Final-fluxui/ && ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0
#docker run -d -p 80:8080 sg-server /bin/bash -c "cd /root/jboss-as-7.1.1.Final-fluxui/ && ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0"