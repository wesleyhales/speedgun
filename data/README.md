chmod +x docker-entrypoint.sh
docker build -t postgres .
docker rm $(docker ps -aq)
sudo docker run --rm -P --name pg_test postgres
