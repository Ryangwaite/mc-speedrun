
-include .env
export $(shell test -e .env && grep '=' .env | sed 's/=.*//' .env)

.PHONY: init
# Initialises the dotenv file
init:
	@if [ ! -e .env ]; then \
		cp .env.example .env; \
		echo "Created '.env'. Configure it with the variables needed to deploy to your environment."; \
	else \
		echo "'.env' already exists. Leaving alone."; \
	fi;


.PHONY: bootstrap
# Boostraps the AWS account for cdk deployment
bootstrap:
	@ACCOUNT_TO_BOOTSTRAP=$$(aws sts get-caller-identity | jq -r .Account) && \
	if [ -z $${ACCOUNT_TO_BOOTSTRAP} ]; then \
		echo "Failed to determine account to bootstrap" && exit 1; \
	fi && \
	if [ -z $${AWS_DEFAULT_REGION} ]; then \
		echo "No default region specified. Remember to set it in .env" && exit 1; \
	fi && \
	cdk bootstrap aws://$${ACCOUNT_TO_BOOTSTRAP}/${AWS_DEFAULT_REGION};


.PHONY: unbootstrap
# Removes all traces of the bootstrapping of the account
unbootstrap:
	@# Empty the bucket of all versions and objects if it exists before deleting it
	-@S3_BUCKET=$$(aws s3 ls | grep cdk | cut -d' ' -f3) && \
	if [ -z $$S3_BUCKET ]; then \
		echo "Could not find bucket" && exit 1; \
	fi && \
	OBJECTS_TO_DELETE="$$(aws s3api list-object-versions --bucket $${S3_BUCKET} --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" && \
	if [ -n "$${OBJECTS_TO_DELETE}" -a "$$(echo "$${OBJECTS_TO_DELETE}" | jq -r .Objects)" != "null" ]; then \
		echo "Deleting objects from S3 bucket..."; \
		aws s3api delete-objects \
			--no-cli-pager \
			--bucket $${S3_BUCKET} \
			--delete "$${OBJECTS_TO_DELETE}"; \
		echo "Finished deleting objects from S3 bucket."; \
	else \
		echo "No objects to delete from S3 bucket"; \
	fi && \
	DELETE_MARKERS_TO_DELETE="$$(aws s3api list-object-versions --bucket $${S3_BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')" && \
	if [ -n "$${DELETE_MARKERS_TO_DELETE}" -a "$$(echo "$${DELETE_MARKERS_TO_DELETE}" | jq -r .Objects)" != "null" ]; then \
		echo "Deleting delete markers from S3 bucket..."; \
		aws s3api delete-objects \
			--no-cli-pager \
			--bucket $${S3_BUCKET} \
			--delete "$${DELETE_MARKERS_TO_DELETE}"; \
		echo "Finished deleting delete markers from S3 bucket."; \
	else \
		echo "No delete markers to delete from S3 bucket"; \
	fi && \
	echo "Deleting bucket '$${S3_BUCKET}'..." && \
	aws s3 rb "s3://$${S3_BUCKET}" && \
	echo "Bucket deleted";
	
	@# Delete the ECR repo forcefully first since the stack deletion won't remove it if it has objects in it
	-@ECR_REPO=$$(aws ecr describe-repositories | jq -r .repositories[].repositoryName | grep cdk) && \
	if [ -z $${ECR_REPO} ]; then \
		echo "Could not find ecr repo" && exit 1; \
	fi && \
	aws ecr delete-repository --force --repository-name $${ECR_REPO};

	aws cloudformation delete-stack --stack-name CDKToolkit;
	

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
