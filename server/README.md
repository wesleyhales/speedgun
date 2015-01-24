##Running server locally using Vagrant

0. Install VirtualBox and Vagrant
1. Run: ```./server.sh```
2. If vagrant bombs out with this error: "Failed to mount folders in Linux guest. This is usually because the "vboxsf" file system is not available...." then run:
 ```./fix-virtualbox.sh```
3. After build is done, open your browser and go to http://localhost:8081


###Notes

* run -ti === interactive mode, should be -d for prod server
* --net=host === allows use of host network stack.. otherwise no access

###problems with vagrant:

####ref http://stackoverflow.com/questions/22717428/vagrant-error-failed-to-mount-folders-in-linux-guest

####ref https://gist.github.com/kazu69/4576d886089358ad61b0

###Docker no sudo
sudo chmod +s /usr/bin/docker
