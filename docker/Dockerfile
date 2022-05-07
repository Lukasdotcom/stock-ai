FROM ubuntu:impish
ENV DEBIAN_FRONTEND noninteractive
ENV TZ America/Detroit
# Used to install all the required software
RUN apt update
RUN apt upgrade -y
RUN apt install -y nodejs --no-install-recommends
RUN apt install -y npm --no-install-recommends
RUN apt install -y git --no-install-recommends
RUN apt install -y mariadb-server --no-install-recommends
RUN mkdir /var/www
WORKDIR /var/www
RUN git clone https://github.com/Lukasdotcom/stock-ai
WORKDIR /var/www/stock-ai
RUN npm install
# Sets the default configuration
ENV TYPE=production
ENV ADMIN_PASSWORD=password
ENV NEXTAUTH_SECRET=hkf9eUXAZKjw99/hZ4Rrw7aNe47qxB+QuojMwmxbFqA=
CMD ./entrypoint.sh
EXPOSE 3000