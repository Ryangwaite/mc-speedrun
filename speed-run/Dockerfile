FROM gradle:7.3.0-jdk11-alpine AS builder

# TODO: Only copy whats necessary to limit the probability that gradle needs to be downloaded on subsequent builds

# Use the local sources but take note of the .dockerignore
# which ignores host machine artifacts so we can build totally fresh in here
COPY . ./

RUN ./gradlew installDist

FROM openjdk:11

COPY --from=builder /home/gradle/build/install/com.ryangwaite.speed-run /app/

# For consistency, keep the following in-sync with CDK infra
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 CMD \
    curl --silent --fail http://localhost/ping | grep  --silent "pong" || exit 1

WORKDIR /app/bin
ENTRYPOINT ["./com.ryangwaite.speed-run"]