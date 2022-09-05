
include .env
export $(shell grep '=' .env | sed 's/=.*//' .env)


.PHONY: deploy
# Deploy the entire application to AWS
deploy:
	@cdk deploy --require-approval never Network Subdomain Quiz


.PHONY: watch
# Deploy the entire application to AWS in watch mode
watch:
	@cdk watch --require-approval never Network Subdomain Quiz


.PHONY: destroy
# Deletes the entire deployment from AWS
destroy:
	@cdk destroy TODO: finish this one off
