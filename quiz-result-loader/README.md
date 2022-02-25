
# Useful commands for testing

## DynamoDB

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

## Triggering quiz-result-loader

To trigger 10 in parallel run:
```bash
for i in 1 2 3 4 5 6 7 8 9 10; do { ./load-sample-data quiz$i & }; done
```