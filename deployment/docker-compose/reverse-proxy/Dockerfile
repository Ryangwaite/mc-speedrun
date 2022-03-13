# NOTE: Since the UI code is in a parent directory we need to set the build context to
# the root of the repo so that it can be found and so all paths are relative to that.
# To build run:
#   docker build -t reverse-proxy -f deployment/docker-compose/reverse-proxy/Dockerfile .

# TODO: Align node version with local development
FROM node:10.14.1-alpine as build-ui
COPY ui/ /home/ui/

WORKDIR /home/ui
RUN npm install
RUN npm run build

FROM nginx:alpine

COPY --from=build-ui /home/ui/build/ /srv/www/
COPY deployment/docker-compose/reverse-proxy/nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT [ "/usr/sbin/nginx" ]
CMD [ "-g", "daemon off;" ]