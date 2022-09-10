FROM gradle:7.3.0-jdk11-alpine AS builder

COPY gradle.properties .
COPY src src
COPY build.gradle.kts .
COPY settings.gradle.kts .

RUN gradle installDist

# TODO: This image has been deprecated. Switch to a new one. Refer to: https://github.com/docker-library/openjdk/issues/505
# Also would be good to get a much slimer one to reduce upload times to AWS ECR
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
