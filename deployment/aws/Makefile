
include .env
export $(shell grep '=' .env | sed 's/=.*//' .env)


.PHONY: bootstrap
# Boostraps the AWS account for cdk deployment
bootstrap:
	@echo TODO: implement this something like 'cdk bootstrap aws://<aws-account>/us-east-1' though


.PHONY: unbootstrap
# Removes all traces of the bootstrapping of the account
unbootstrap:
	@echo TODO: implement this


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
	@cdk destroy --all
