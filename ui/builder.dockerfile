# Image for building the project in a docker container.
# It's the environment for building the UI as part of CDK deployment.

FROM node:16.13.1-alpine as build-ui

# Create directory for building in that is owned by a user with
# the uid:gid as the host to prevent in permission issues
WORKDIR /home/ui
RUN chown 1000:1000 .

USER 1000

COPY --chown=1000:1000 package.json .
COPY --chown=1000:1000 package-lock.json .

# Install now before more volatile files are copied in to increase
# likelihood that downloads are cached
RUN npm install

# Copy the more volatile files in
COPY --chown=1000:1000 public/ public/
COPY --chown=1000:1000 src/ src/
COPY --chown=1000:1000 test/ test/
COPY --chown=1000:1000 .env.production .
COPY --chown=1000:1000 tsconfig.json .

ENTRYPOINT [ "npm", "run", "build" ]