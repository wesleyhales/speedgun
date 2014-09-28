#!/bin/sh
mvn clean install && rm -rf jboss-as-7.1.1.Final-fluxui/standalone/tmp/ jboss-as-7.1.1.Final-fluxui/standalone/data/* \
&& cd jboss-as-7.1.1.Final-fluxui && sudo ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0