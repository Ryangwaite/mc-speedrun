FROM gradle:7.3.0-jdk11-alpine AS builder

# Use the local sources but take note of the .dockerignore
# which ignores host machine artifacts so we can build totally fresh in here
COPY . ./

RUN ./gradlew installDist

FROM openjdk:11
COPY --from=builder /home/gradle/build/install/com.ryangwaite.sign-on /app/

WORKDIR /app/bin
ENTRYPOINT ["./com.ryangwaite.sign-on"]

