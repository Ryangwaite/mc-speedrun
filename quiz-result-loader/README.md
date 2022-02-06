

Listing tables for dynamodb served out of the docker-compose environment:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

Deleting a table:
```bash
aws dynamodb delete-table --table-name quiz --endpoint-url http://localhost:8000
```

Scan table contents:
```bash
 aws dynamodb scan --table-name quiz --endpoint-url http://localhost:8000
 ```