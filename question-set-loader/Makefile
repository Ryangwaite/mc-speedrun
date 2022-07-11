SERVICE_NAME = $(shell basename `pwd`)
CONTAINER_NAME = "mc-speedrun/$(SERVICE_NAME)"


.PHONY: container-build
# Make the docker container deployment
container-build: Dockerfile
	@docker build --tag $(CONTAINER_NAME) --file Dockerfile .
	@echo "Done building."


.PHONY: container-run
# Run the docker container locally. Builds it if it doesn't exist
container-run:
	@if ! docker image inspect $(CONTAINER_NAME) > /dev/null 2>&1; then \
		echo "$(CONTAINER_NAME) doesn't exist. Building it..."; \
		$(MAKE) container-build; \
	fi;
	@docker run --rm $(CONTAINER_NAME)


.PHONY: container-clean
# Deletes the docker container if it exists
container-clean:
	-@docker image remove $(CONTAINER_NAME)


.PHONY: cdk-lambda-build
# Make the binary contained in the lambda deployment package.
# NOTE: This should only be called by the cdk, else files will be created
# in directories outside the repo root
cdk-lambda-build:
	@go build -o /asset-output/lambda ./cmd/lambda
	@echo "Done building."


.PHONY: cdk-lambda-clean
# Deletes the build artifacts if they exist
cdk-lambda-clean:
	@rm -f /asset-output/lambda
