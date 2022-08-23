FROM gradle:7.3.0-jdk11-alpine AS builder

# Use the local sources but take note of the .dockerignore
# which ignores host machine artifacts so we can build totally fresh in here
COPY . ./

RUN ./gradlew installDist

FROM openjdk:11 AS base

COPY --from=builder /home/gradle/build/install/com.ryangwaite.speed-run /app/

# For consistency, keep the following in-sync with CDK infra
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 CMD \
    curl --silent --fail http://localhost/api/ping | grep  --silent "pong" || exit 1

WORKDIR /app/bin
ENTRYPOINT ["./com.ryangwaite.speed-run"]

FROM base as AWS

# Install botocore so that the NFS mount target DNS address can be resolved to an IP
RUN apt-get update && apt-get install --yes \
    python3-pip

RUN pip3 install botocore

# Create mount point for EFS quiz directory
RUN mkdir /quiz-questions
