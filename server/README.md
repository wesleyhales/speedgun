##Running server locally

1. vagrant up
2. vagrant ssh
3. cd /vagrant && sudo docker build .
4. sudo docker run -ti -p 8080 --net=host [latest image ID] /bin/bash (get the image ID from ```sudo docker ps -a```)


##Everything from hereon is notes that need formatting

sudo docker build -t speedgun .
sudo docker run -ti -v /vagrant/data:/root/speedgun/core/reports -p 8080 --net=host 082c01e8024d /bin/bash
sudo docker run -ti -v /vagrant/data:/root/speedgun/core/reports -v /vagrant/bin:/root/phantomjs/bin2 -p 8080 --net=host 0d5c86e5cafc /bin/bash


run -ti === interactive mode, should be -d for prod server
--net=host === allows use of host network stack.. otherwise no access

###run everything from /vagrant

dev:
sudo docker run -ti
   -v /vagrant/data:/root/speedgun/core/reports #report data
   -v /vagrant/bin:/root/phantomjs/bin #custom build of phantomjs
   -v /vagrant/target/speedgun:/root/jboss-as-7.1.1.Final-fluxui/standalone/deployments/speedgun.war -p 8080 --net=host 0d5c86e5cafc /bin/bash #mount the speedgun.war exploded for local dev

   sudo docker run -ti -v /root/phantomjs/bin:/vagrant/bin -p 8080 --net=host 326dd5a03682 /bin/bash

prod:
sudo docker run -d -p 80:8080 141ebfdef87a /bin/bash -c "sudo /etc/init.d/mysql start &&
 cd /root/jboss-as-7.1.1.Final-fluxui/ && sudo ./bin/standalone.sh --server-config=standalone-full.xml -b 0.0.0.0"

problems with vagrant:

$ vagrant plugin install vagrant-vbguest

$ vagrant up

$ vagrant ssh

In the guest (VM logged).
$ sudo ln -s /opt/VBoxGuestAdditions-4.3.10/lib/VBoxGuestAdditions /usr/lib/VBoxGuestAdditions

Back on the host, reload Vagrant
$ vagrant reload

#ref http://stackoverflow.com/questions/22717428/vagrant-error-failed-to-mount-folders-in-linux-guest

##other crazy folder won't mount error
"Failed to mount folders in Linux guest.
 . Please verify that
 the guest additions are properly installed in the guest and
 can work properly. The command attempted was:"

$>vagrant ssh
$>yum update kernel*

#ref https://gist.github.com/kazu69/4576d886089358ad61b0

#Docker no sudo
sudo chmod +s /usr/bin/docker
