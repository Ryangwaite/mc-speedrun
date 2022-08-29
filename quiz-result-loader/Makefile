SERVICE_NAME = $(shell basename `pwd`)
CONTAINER_NAME = mc-speedrun/$(SERVICE_NAME)

AWS_INFRA_DIR := ../deployment/aws/infra
AWS_INFRA_LAMBDA_TEMPLATE := $(AWS_INFRA_DIR)/cdk.out/QuizResultLoading.template.json

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


.PHONY: cdk-lambda-synthesize
# Synthesizes the cloudformation template for the stack containing the QuizResultLoader
# lambda. This makes it available for local testing via AWS SAM.
cdk-lambda-synthesize:
	@cd $(AWS_INFRA_DIR) && \
	cdk synthesize QuizResultLoading && \
	echo "Successfully synthesized lambda";


.PHONY: cdk-lambda-test-local
# Invokes the lambda locally with the sample-event.json
# NOTE: This won't work until there is a way to mount volumes to the lambda-like
# environment for emulating the EFS mount. See: https://github.com/aws/aws-sam-cli/issues/2589
# The speed-run cache (Redis) and speed-run store (DynamoDB) components should be able to be
# emulated by running them in docker containers that the lambda-like environment can route to.
cdk-lambda-test-local:
	@if [ ! -e $(AWS_INFRA_LAMBDA_TEMPLATE) ]; then \
		echo "Lambda template does not exist. Synthesizing lambda project..."; \
		$(MAKE) cdk-lambda-synthesize; \
	fi;

	sam local invoke QuizResultLoader --event ./cmd/lambda/sample-event.json --template-file $(AWS_INFRA_LAMBDA_TEMPLATE)


.PHONY: cdk-lambda-clean
# Deletes the build artifacts if they exist
cdk-lambda-clean:
	@rm -f /asset-output/lambda
