# sign-on


## Local Development

### intellij IDEA Community

To run in development mode locally run the default launch configuration with the additional `-Dio.ktor.development=true` VM option.

To enable auto-build on save, in a seperate terminal in the root of this directory run:
```bash
 ./gradlew -t build -x test -i
```

