# sign-on


## Local Development

### intellij IDEA Community

To run in development mode locally run the default launch configuration with the additional `-Dio.ktor.development=true` VM option.

To enable auto-build on save, in a seperate terminal in the root of this directory run:
```bash
 ./gradlew -t build -x test -i
```

## Running Tests
### Command-line
```bash
./gradlew test
```

## Dockerfile

To build container run:
```bash
docker build -t sign-on .
```
And to run:
```bash
docker run --rm -p 8080:8080 -it sign-on:latest
```

### Notes
There's weirdness when using jdk8 when trying to run the tests as part of `./gradlew build`. It complains with a method not being found.
If jdk11 is used (which matches my local dev environment) then it works.
TODO: Determine consistent set of jdk/jvms across all environments.

https://stackoverflow.com/questions/61267495/exception-in-thread-main-java-lang-nosuchmethoderror-java-nio-bytebuffer-flip