#Helps to have a line like %sudo ALL=(ALL) NOPASSWD: /bin/systemctl

CONTAINERS=postgis pgbouncer redis client gunicorn nginx pruner sizer

OPERATIONS=reset logs bash

IMAGES=python-bindings graphql-image postgis-image client-image

GIT_VERSION=$(shell git rev-parse HEAD)

# Get python version and set yaml arguments correctly
PYTHON3_REVISION=$(shell python3 --version | grep ^Python | sed 's/^.* //g' | awk -F. '{print $$2}')
ifeq ($(shell if [ $(PYTHON3_REVISION) -ge 7 ]; then echo "7"; fi),7)
YAML_ARGS=Loader=yaml.FullLoader
else
YAML_ARGS=
endif

DOCKERHUB_USER=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["dockerRegistry"])')

SYSTEM_IMAGE_REGISTRY=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a.get("systemImageRepo"))')

# default to dockerhub cvisionai organization
ifeq ($(SYSTEM_IMAGE_REGISTRY),None)
SYSTEM_IMAGE_REGISTRY=cvisionai
endif

POSTGRES_HOST=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["postgresHost"])')
POSTGRES_USERNAME=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["postgresUsername"])')
POSTGRES_PASSWORD=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["postgresPassword"])')

OBJECT_STORAGE_HOST=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print("http://tator-minio:9000" if a["minio"]["enabled"] else a["objectStorageHost"])')
OBJECT_STORAGE_REGION_NAME=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print("us-east-2" if a["minio"]["enabled"] else a["objectStorageRegionName"])')
OBJECT_STORAGE_BUCKET_NAME=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["minio"]["defaultBucket"]["name"] if a["minio"]["enabled"] else a["objectStorageBucketName"])')
OBJECT_STORAGE_ACCESS_KEY=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["minio"]["accessKey"] if a["minio"]["enabled"] else a["objectStorageAccessKey"])')
OBJECT_STORAGE_SECRET_KEY=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a["minio"]["secretKey"] if a["minio"]["enabled"] else a["objectStorageSecretKey"])')

#############################
## Help Rule + Generic targets
#############################
.PHONY: help
help:
	@echo "Tator Online Makefile System"
	@echo  "Generic container operations: (container-action)"
	@echo "\tValid Containers:"
	@echo $(foreach  container, $(CONTAINERS), "\t\t- ${container}\n")
	@echo "\t\t- algorithm"
	@echo "\tValid Operations:"
	@echo $(foreach  operation, $(OPERATIONS), "\t\t- ${operation}\n")
	@echo "\tExample: "
	@echo "\t\tmake tator-reset"
	@echo "\nOther useful targets: "
	@echo "\t\t - collect-static : Runs collect-static on server (manage.py)."
	@echo "\t\t - migrate : Runs migrate on server (manage.py)"
	@echo "\t\t - status : Prints status of container deployment"
	@echo "\t\t - reset : Reset all pods"

	@echo "\t\t - imageQuery: Make sentinel files match docker registry"
	@echo "\t\t - imageHold: Hold sentinel files to current time"
	@echo "\t\t - imageClean: Delete sentinel files + generated dockerfiles"

# Create backup with pg_dump
backup:
	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- pg_dump -Fc -U django -d tator_online -f /backup/tator_online_$$(date +"%Y_%m_%d__%H_%M_%S")_$(GIT_VERSION).sql;

ecr_update:
	$(eval LOGIN := $(shell aws ecr get-login --no-include-email))
	$(eval KEY := $(shell echo $(LOGIN) | python3 -c 'import sys; print(sys.stdin.read().split()[5])'))
	$(LOGIN)
	echo $(KEY) | python3 -c 'import yaml; import sys; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); a["dockerPassword"] = sys.stdin.read(); yaml.dump(a, open("helm/tator/values.yaml", "w"), default_flow_style=False, default_style="|", sort_keys=False)'

# Restore database from specified backup (base filename only)
# Example:
#   make restore SQL_FILE=backup_to_use.sql DB_NAME=backup_db_name
restore: check_restore
	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- createdb -U django $(DB_NAME) 
	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- pg_restore -U django -d $(DB_NAME) /backup/$(SQL_FILE)

.PHONY: check_restore
check_restore:
	@echo -n "This will create a backup database and restore. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]

init-logs:
	kubectl logs $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -c init-tator-online

# Top-level rule to catch user action + podname and whether it is present
# Sets pod name to the command to execute on each pod.
define generate_rule
$(1)-$(2):
	make podname=$(1) _$(2);
endef

$(foreach action,$(OPERATIONS),$(foreach container,$(CONTAINERS),$(eval $(call generate_rule,$(container),$(action)))))

# Generic handlers (variable podname is set to the requested pod)
_reset:
	kubectl delete pods -l app=$(podname)

_bash:
	kubectl exec -it $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///') -- /bin/bash

_logs:
	kubectl describe pod $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///')
	kubectl logs $$(kubectl get pod -l "app=$(podname)" -o name | head -n 1 | sed 's/pod\///') -f

django-shell:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py shell


#####################################
## Custom rules below:
#####################################
.PHONY: status
status:
	kubectl get --watch pods -o wide --sort-by="{.spec.nodeName}"

.ONESHELL:

.PHONY: check-migration
check-migration:
	scripts/check-migration.sh $(pwd)

cluster: main/version.py clean_schema
	$(MAKE) images cluster-deps cluster-install

cluster-deps:
	helm dependency update helm/tator

cluster-install:
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta4/aio/deploy/recommended.yaml # No helm chart for this version yet
	helm install --debug --atomic --timeout 60m0s --set gitRevision=$(GIT_VERSION) tator helm/tator

cluster-upgrade: check-migration main/version.py clean_schema images
	helm upgrade --debug --atomic --timeout 60m0s --set gitRevision=$(GIT_VERSION) tator helm/tator

cluster-update: 
	helm upgrade --debug --atomic --timeout 60m0s --set gitRevision=$(GIT_VERSION) tator helm/tator

cluster-uninstall:
	kubectl delete apiservice v1beta1.metrics.k8s.io
	kubectl delete all --namespace kubernetes-dashboard --all
	helm uninstall tator

.PHONY: clean
clean: cluster-uninstall

dashboard-token:
	kubectl -n kube-system describe secret $$(kubectl -n kube-system get secret | grep tator-kubernetes-dashboard | awk '{print $$1}')

.PHONY: tator-image
tator-image: webpack
	docker build --network host -t $(DOCKERHUB_USER)/tator_online:$(GIT_VERSION) -f containers/tator/Dockerfile . || exit 255
	docker push $(DOCKERHUB_USER)/tator_online:$(GIT_VERSION)

.PHONY: graphql-image
graphql-image:
	if [ ! -f doc/_build/schema.yaml ]; then
		make schema
	fi
	docker build --network host -t $(DOCKERHUB_USER)/tator_graphql:$(GIT_VERSION) -f containers/tator_graphql/Dockerfile . || exit 255
	docker push $(DOCKERHUB_USER)/tator_graphql:$(GIT_VERSION)

.PHONY: postgis-image
postgis-image:
	docker build --network host -t $(DOCKERHUB_USER)/tator_postgis:latest -f containers/postgis/Dockerfile . || exit 255
	docker push $(DOCKERHUB_USER)/tator_postgis:latest

EXPERIMENTAL_DOCKER=$(shell docker version --format '{{json .Client.Experimental}}')
ifeq ($(EXPERIMENTAL_DOCKER), true)
# exists if experimental docker is not found
.PHONY: experimental_docker
experimental_docker:
	@echo "NOTICE:\tDetected experimental docker"
else
.PHONY: experimental_docker
experimental_docker:
	@echo  "ERROR:\tImage build requires '--platform' argument which requires docker client experimental features"
	@echo "\tUpgrade to docker client version >= 20.10.17 or turn on the experimental flag manually in config.json"
	@echo "\tFor more info, see 'man docker-config-json'"
	exit 255
endif


# Publish client image to dockerhub so it can be used cross-cluster
.PHONY: client-image
client-image: experimental_docker
	docker build --platform linux/amd64 --network host -t $(SYSTEM_IMAGE_REGISTRY)/tator_client_amd64:$(GIT_VERSION) -f containers/tator_client/Dockerfile . || exit 255
	docker build --platform linux/aarch64 --network host -t $(SYSTEM_IMAGE_REGISTRY)/tator_client_aarch64:$(GIT_VERSION) -f containers/tator_client/Dockerfile_arm . || exit 255
	docker push $(SYSTEM_IMAGE_REGISTRY)/tator_client_amd64:$(GIT_VERSION)
	docker push $(SYSTEM_IMAGE_REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest create --insecure $(SYSTEM_IMAGE_REGISTRY)/tator_client:$(GIT_VERSION) --amend $(SYSTEM_IMAGE_REGISTRY)/tator_client_amd64:$(GIT_VERSION) --amend $(SYSTEM_IMAGE_REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest create --insecure $(SYSTEM_IMAGE_REGISTRY)/tator_client:latest --amend $(SYSTEM_IMAGE_REGISTRY)/tator_client_amd64:$(GIT_VERSION) --amend $(SYSTEM_IMAGE_REGISTRY)/tator_client_aarch64:$(GIT_VERSION)
	docker manifest push $(SYSTEM_IMAGE_REGISTRY)/tator_client:$(GIT_VERSION)
	docker manifest push $(SYSTEM_IMAGE_REGISTRY)/tator_client:latest

.PHONY: client-latest
client-latest: client-image
	docker tag $(SYSTEM_IMAGE_REGISTRY)/tator_client:$(GIT_VERSION) cvisionai/tator_client:latest
	docker push cvisionai/tator_client:latest

.PHONY: braw-image
braw-image:
	docker build --network host -t $(SYSTEM_IMAGE_REGISTRY)/tator_client_braw:$(GIT_VERSION) -f containers/tator_client_braw/Dockerfile . || exit 255
	docker push $(SYSTEM_IMAGE_REGISTRY)/tator_client_braw:$(GIT_VERSION)
	docker tag $(SYSTEM_IMAGE_REGISTRY)/tator_client_braw:$(GIT_VERSION) $(SYSTEM_IMAGE_REGISTRY)/tator_client_braw:latest
	docker push $(SYSTEM_IMAGE_REGISTRY)/tator_client_braw:latest

.PHONY: main/version.py
main/version.py:
	./scripts/version.sh > main/version.py
	chmod +x main/version.py

collect-static: webpack
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 |sed 's/pod\///') -- rm -rf /tator_online/main/static
	kubectl cp ui/dist $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 |sed 's/pod\///'):/tator_online/main/static
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 |sed 's/pod\///') -- python3 manage.py collectstatic --noinput

dev-push:
	@scripts/dev-push.sh

USE_MIN_JS=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print(a.get("useMinJs","True"))')
ifeq ($(USE_MIN_JS),True)
webpack:
	@echo "Building webpack bundles for production, because USE_MIN_JS is true"
	cd ui && npm install && python3 make_index_files.py && npm run build
else
webpack:
	@echo "Building webpack bundles for development, because USE_MIN_JS is false"
	cd ui && npm install && python3 make_index_files.py && npm run buildDev
endif

.PHONY: migrate
migrate:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py makemigrations
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 manage.py migrate

.PHONY: testinit
testinit:
	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d tator_online -c 'CREATE DATABASE test_tator_online';
	kubectl exec -it $$(kubectl get pod -l "app=postgis" -o name | head -n 1 | sed 's/pod\///') -- psql -U django -d test_tator_online -c 'CREATE EXTENSION LTREE';

.PHONY: test
test:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 -c 'from elasticsearch import Elasticsearch; import os; es = Elasticsearch(host=os.getenv("ELASTICSEARCH_HOST")).indices.delete("test*")'
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- sh -c 'ELASTICSEARCH_PREFIX=test python3 manage.py test --keep'

.PHONY: cache_clear
cache-clear:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- python3 -c 'from main.cache import TatorCache;TatorCache().invalidate_all()'

.PHONY: cleanup-evicted
cleanup-evicted:
	kubectl get pods | grep Evicted | awk '{print $$1}' | xargs kubectl delete pod

# Example:
#   make build-search-indices MAX_AGE_DAYS=365
.PHONY: build-search-indices
build-search-indices:
	argo submit workflows/build-search-indices.yaml --parameter-file helm/tator/values.yaml -p version="$(GIT_VERSION)" -p dockerRegistry="$(DOCKERHUB_USER)" -p maxAgeDays="$(MAX_AGE_DAYS)" -p objectStorageHost="$(OBJECT_STORAGE_HOST)" -p objectStorageRegionName="$(OBJECT_STORAGE_REGION_NAME)" -p objectStorageBucketName="$(OBJECT_STORAGE_BUCKET_NAME)" -p objectStorageAccessKey="$(OBJECT_STORAGE_ACCESS_KEY)" -p objectStorageSecretKey="$(OBJECT_STORAGE_SECRET_KEY)"

.PHONY: images
images:
	make ${IMAGES}

lazyPush:
	rsync -a -e ssh --exclude main/migrations --exclude main/__pycache__ main adamant:/home/brian/working/tator_online

.PHONY: python-bindings-only
python-bindings-only:
	if [ ! -f doc/_build/schema.yaml ]; then
		make schema
	fi
	cp doc/_build/schema.yaml scripts/packages/tator-py/.
	cd scripts/packages/tator-py
	rm -rf dist
	python3 setup.py sdist bdist_wheel
	if [ ! -f dist/*.whl ]; then
		exit 1
	fi
	cd ../../..

.PHONY: python-bindings
python-bindings: tator-image
	if [ ! -f doc/_build/schema.yaml ]; then
		make schema
	fi
	cp doc/_build/schema.yaml scripts/packages/tator-py/.
	cd scripts/packages/tator-py
	rm -rf dist
	python3 setup.py sdist bdist_wheel
	if [ ! -f dist/*.whl ]; then
		exit 1
	fi
	cd ../../..

.PHONY: js-bindings
js-bindings:
	rm -f scripts/packages/tator-js/tator-openapi-schema.yaml
	if [ ! -f doc/_build/schema.yaml ]; then
		make schema
	fi
	cp doc/_build/schema.yaml scripts/packages/tator-js/.
	cd scripts/packages/tator-js
	rm -rf pkg
	mkdir pkg
	mkdir pkg/src
	./codegen.py tator-openapi-schema.yaml
	docker run -it --rm \
		-v $(shell pwd)/scripts/packages/tator-js:/pwd \
		openapitools/openapi-generator-cli:v6.1.0 \
		generate -c /pwd/config.json \
		-i /pwd/tator-openapi-schema.yaml \
		-g javascript -o /pwd/pkg -t /pwd/templates
	docker run -it --rm \
		-v $(shell pwd)/scripts/packages/tator-js:/pwd \
		openapitools/openapi-generator-cli:v6.1.0 \
		chmod -R 777 /pwd/pkg
	cp -r examples pkg/examples
	cp -r utils pkg/src/utils
	cp webpack* pkg/.
	cd pkg && npm install
	npm install querystring webpack webpack-cli --save-dev
	npx webpack --config webpack.prod.js
	mv dist/tator.min.js .
	npx webpack --config webpack.dev.js
	mv tator.min.js dist/.
	cd ../../../..
	cp scripts/packages/tator-js/pkg/dist/tator.min.js ui/dist/.
	cp scripts/packages/tator-js/pkg/dist/tator.js ui/dist/.

.PHONY: r-docs
r-docs:
	docker inspect --type=image $(DOCKERHUB_USER)/tator_online:$(GIT_VERSION) && \
	if [ ! -f doc/_build/schema.yaml ]; then
		make schema
	fi
	cp doc/_build/schema.yaml scripts/packages/tator-r/.
	rm -rf scripts/packages/tator-r/tmp
	mkdir -p scripts/packages/tator-r/tmp
	./scripts/packages/tator-r/codegen.py $(shell pwd)/scripts/packages/tator-r/schema.yaml
	docker run -it --rm \
		-v $(shell pwd)/scripts/packages/tator-r:/pwd \
		-v $(shell pwd)/scripts/packages/tator-r/tmp:/out openapitools/openapi-generator-cli:v5.0.0-beta \
		generate -c /pwd/config.json \
		-i /pwd/schema.yaml \
		-g r -o /out/tator-r-new-bindings -t /pwd/templates
	docker run -it --rm \
		-v $(shell pwd)/scripts/packages/tator-r/tmp:/out openapitools/openapi-generator-cli:v5.0.0-beta \
		/bin/sh -c "chown -R nobody:nogroup /out"
	rm -f scripts/packages/tator-r/R/generated_*
	rm scripts/packages/tator-r/schema.yaml
	cd $(shell pwd)/scripts/packages/tator-r/tmp/tator-r-new-bindings/R && \
		for f in $$(ls -l | awk -F':[0-9]* ' '/:/{print $$2}'); do cp -- "$$f" "../../../R/generated_$$f"; done
	docker run -it --rm \
		-v $(shell pwd)/scripts/packages/tator-r:/tator \
		rocker/tidyverse:latest \
		/bin/sh -c "R --slave -e \"devtools::install_deps('/tator')\"; \
		R CMD build tator; R CMD INSTALL tator_*.tar.gz; \
		R --slave -e \"install.packages('pkgdown')\"; \
		Rscript -e \"devtools::document('tator')\"; \
		Rscript -e \"pkgdown::build_site('tator')\"; \
		chown -R $(shell id -u):$(shell id -g) /tator"
	rm -rf $(shell pwd)/doc/_build/html/tator-r
	cp -r $(shell pwd)/scripts/packages/tator-r/docs $(shell pwd)/doc/_build/html/tator-r
	touch $(shell pwd)/doc/tator-r/overview.rst
	touch $(shell pwd)/doc/tator-r/reference/api.rst
	cd ../../..

TOKEN=$(shell cat token.txt)
HOST=$(shell python3 -c 'import yaml; a = yaml.load(open("helm/tator/values.yaml", "r"),$(YAML_ARGS)); print("https://" + a["domain"])')
.PHONY: pytest
pytest:
	cd scripts/packages/tator-py && pip3 install . --upgrade && pytest --full-trace --host $(HOST) --token $(TOKEN)

.PHONY: letsencrypt
letsencrypt:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- env DOMAIN=$(DOMAIN) env DOMAIN_KEY=$(DOMAIN_KEY) env SIGNED_CHAIN=$(SIGNED_CHAIN) env KEY_SECRET_NAME=$(KEY_SECRET_NAME) env CERT_SECRET_NAME=$(CERT_SECRET_NAME) scripts/cert/letsencrypt.sh 

.PHONY: selfsigned
selfsigned:
	kubectl exec -it $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- env DOMAIN=$(DOMAIN) env DOMAIN_KEY=$(DOMAIN_KEY) env SIGNED_CHAIN=$(SIGNED_CHAIN) env KEY_SECRET_NAME=$(KEY_SECRET_NAME) env CERT_SECRET_NAME=$(CERT_SECRET_NAME) scripts/cert/selfsigned.sh

.PHONY: markdown-docs
markdown-docs:
	sphinx-build -M markdown ./doc ./doc/_build
	mkdir -p ./doc/_build/tator-py
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/utilities.md ./doc/_build/tator-py/utilities.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/api.md ./doc/_build/tator-py/api.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/models.md ./doc/_build/tator-py/models.md
	python3 scripts/format_markdown.py ./doc/_build/markdown/tator-py/exceptions.md ./doc/_build/tator-py/exceptions.md

.PHONY: schema
schema:
	mkdir -p doc/_build
	docker run -it --rm -e DJANGO_SECRET_KEY=1337 -e ELASTICSEARCH_HOST=127.0.0.1 -e TATOR_DEBUG=false -e TATOR_USE_MIN_JS=false $(DOCKERHUB_USER)/tator_online:$(GIT_VERSION) python3 manage.py getschema > doc/_build/schema.yaml
	sed -i "s/\^\@//g" doc/_build/schema.yaml

.PHONY: check_schema
check_schema:
	docker run -it --rm -e DJANGO_SECRET_KEY=1337 -e ELASTICSEARCH_HOST=127.0.0.1 -e TATOR_DEBUG=false -e TATOR_USE_MIN_JS=false $(DOCKERHUB_USER)/tator_online:$(GIT_VERSION) python3 manage.py getschema

.PHONY: clean_schema
clean_schema:
	rm -f doc/_build/schema.yaml

ifdef PROJECT_ID
ANNOUNCE_CMD=python3 manage.py announce --file /tmp/announce.md --project $(PROJECT_ID)
else ifdef USER_ID
ANNOUNCE_CMD=python3 manage.py announce --file /tmp/announce.md --user $(USER_ID)
else
ANNOUNCE_CMD=python3 manage.py announce --file /tmp/announce.md
endif
# Makes an announcement
# System-wide announcement:
# make announce FILE=blah.md
# Project-wide announcement:
# make announce FILE=blah.md PROJECT_ID=1
# User-specific announcement:
# make announce FILE=blah.md USER_ID=1
.PHONY: announce
announce:
	kubectl cp $(FILE) $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///'):/tmp/announce.md
	kubectl exec $$(kubectl get pod -l "app=gunicorn" -o name | head -n 1 | sed 's/pod\///') -- $(ANNOUNCE_CMD) 
