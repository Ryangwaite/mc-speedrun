


## Check if the reverse-proxy can route to sign-on
```bash
docker-compose up
docker exec deployment_reverse-proxy_1 curl -v -X POST http://sign-on:8080/sign-on/host/test
```
A JSON response containing a JWT token should be returned