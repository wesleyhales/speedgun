VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "chef/centos-6.5"

  #config.vm.network "public_network"

  config.vm.provider "virtualbox" do |v|
    v.customize ["modifyvm", :id, "--memory", 2048]
    v.customize ["modifyvm", :id, "--cpus", 1]
    v.customize ["modifyvm", :id, "--cpuexecutioncap", "80"]
    v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
  end

  config.vm.provision "shell", inline:"sudo rpm -iUvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm && \
                                       sudo yum -y update && \
                                       sudo yum -y install docker-io"

  config.vm.provision "shell", inline:"sudo /etc/init.d/docker start"
  config.vm.provision "shell", inline:"sudo chmod +s /usr/bin/docker"
  #config.vm.synced_folder "./target/", "/vagrant/target"
  config.vm.network "forwarded_port", guest: 7199, host: 7199
  config.vm.network "forwarded_port", guest: 9160, host: 9160
  config.vm.network "forwarded_port", guest: 9042, host: 9042
end
