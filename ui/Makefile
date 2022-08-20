
PWD = $(shell pwd)
BUILDER_IMAGE ?= "mc-speedrun/ui-builder"

.PHONY: _builder
# Builds the builder environment with all the sources
_builder:
	@docker build -t $(BUILDER_IMAGE) -f builder.dockerfile .


HOST_OUTPUT_DIR ?= $(PWD)/build

.PHONY: build-prod
# Build a production version of the site in a container for use
# in aws cdk
build-prod: _builder
	@mkdir -p $(HOST_OUTPUT_DIR)
	@docker run --rm -it \
		--mount type=bind,source="$(HOST_OUTPUT_DIR),target=/home/ui/build" \
		$(BUILDER_IMAGE)
