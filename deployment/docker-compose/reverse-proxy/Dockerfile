# NOTE: Since the UI code is in a parent directory we need to set the build context to
# the root of the repo so that it can be found and so all paths are relative to that.
# To build run:
#   docker build -t reverse-proxy -f deployment/docker-compose/reverse-proxy/Dockerfile .

FROM nginx:alpine

COPY ui/build/ /srv/www/
COPY deployment/docker-compose/reverse-proxy/nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT [ "/usr/sbin/nginx" ]
CMD [ "-g", "daemon off;" ]