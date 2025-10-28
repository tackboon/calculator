.PHONY: openapi_typescript
openapi_typescript:
	@docker run --rm --user $(shell id -u):$(shell id -g) -v "$(shell pwd):/local" \
		openapitools/openapi-generator-cli:v6.0.1 generate \
		-i http://host.docker.internal:5000/openapi.json \
		-g typescript-axios \
		-o /local/web/src/openapi
