## 1. Deploying

To deploy, run:
```bash
make docker-compose-up
```

## 2. Architecture

![docker-compose architecture](architecture-docker-compose.drawio.png)


All services are hosted in individual docker containers.

## 3. Troubleshooting

### Check if the reverse-proxy can route to sign-on
```bash
make docker-compose-up
docker exec deployment_reverse-proxy_1 curl -v -X POST http://sign-on:8080/sign-on/host/test
```
A JSON response containing a JWT token should be returned

### Removing volumes
```bash
docker-compose down -v
```