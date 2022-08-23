FROM gradle:7.3.0-jdk11-alpine AS builder

COPY docs docs
COPY gradle.properties .
COPY src src
COPY build.gradle.kts .
COPY settings.gradle.kts .

RUN gradle installDist

FROM openjdk:11
COPY --from=builder /home/gradle/build/install/com.ryangwaite.sign-on /app/

# For consistency, keep the following in-sync with CDK infra
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 CMD \
    curl --silent --fail http://localhost/api/ping | grep  --silent "pong" || exit 1

WORKDIR /app/bin
ENTRYPOINT ["./com.ryangwaite.sign-on"]
