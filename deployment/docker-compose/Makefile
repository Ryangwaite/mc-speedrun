
SECRETS ?= secrets
SERVER_KEY = "${SECRETS}/server-key.pem"
SERVER_CRT = "${SECRETS}/server-crt.pem"

.PHONY: pki
# Generate the nginx server certificate and private key for SSL connections.
# NOTE: This is a self-signed certificate with a private key that doesn't have a password.
pki:
	@if [ -f ${SERVER_CRT} -a -f ${SERVER_KEY} ]; then \
		echo "Certificate and key already exist. Reusing them" && exit 0; \
	else \
		# Create certificate and key \
		mkdir -p "${SECRETS}"; \
		openssl req -x509 \
			-newkey rsa:4096 \
			-keyout "${SERVER_KEY}" \
			-out "${SERVER_CRT}" \
			-sha256 \
			-nodes \
			-days 365; \
	fi;


.PHONY: clean
clean:
	@rm -rf ${SECRETS}


.PHONY: build
# Build all components for instantiating the application
build:
	@# Make the UI assets first
	@$(MAKE) -C ../../ui build-prod
	@docker-compose build --parallel


.PHONY: docker-compose-up
# Bring up the docker-compose environment
docker-compose-up: pki
	@echo "Launching docker-compose environment"
	@docker-compose up


.PHONY: docker-compose-down
# Bring down the docker-compose environment
docker-compose-down:
	@docker-compose down
