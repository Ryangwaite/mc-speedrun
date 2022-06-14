
SECRETS ?= secrets
SERVER_KEY = "${SECRETS}/server-key.pem"
SERVER_CRT = "${SECRETS}/server-crt.pem"

# Generate the nginx server certificate and private key for SSL connections.
# NOTE: This is a self-signed certificate with a private key that doesn't have a password.
.PHONY: pki
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


# Launch the docker-compose enmvironment
.PHONY: pki
docker-compose-up: pki
	@echo "Launching docker-compose environment"
	@docker-compose up
