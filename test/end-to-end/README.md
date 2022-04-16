# End-to-end Tests

To run:

1. Start the docker-compose environment:
```bash
# In ../../deployment/docker-compose/
docker-compose up
```
2. Run `pytest --headed --slowmo 100`
3. Terminate the compose environment
```bash
# In ../../deployment/docker-compose/
docker-compose down
```