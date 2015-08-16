#!/bin/sh
vagrant ssh -c 'sudo yum -y update kernel*' && vagrant provision && vagrant reload && echo "Vagrant is ready."
