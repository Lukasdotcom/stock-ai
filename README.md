# Stock-AI
This is simply a website that can be used for advice when buying stocks. This will probably not come up with a good strategy, but you can try it yourself by installing the docker container or by visiting my self hosted version at [here](https://stocks.lschaefer.xyz).

# Docker
To install the docker container first get the enviromental file by running the command below. Then edit the file to your choosing.
```
wget https://raw.githubusercontent.com/Lukasdotcom/stock-ai/master/docker/.env
```
Finally run the command below to start the container.
```
docker run -d -p 80:3000 --name stock --env-file .env --volume=db:/var/lib/mysql lukasdotcom/stock-ai
```
