.PHONY: help deploy-prod deploy-local local-stop local-logs local-shell-fe local-shell-be clean

PROJECT_ROOT := $(shell git rev-parse --show-toplevel)
COMPOSE_DEBUG := docker compose --project-directory $(PROJECT_ROOT) -f $(PROJECT_ROOT)/docker-compose.debug.yml
COMPOSE_PROD := docker compose --project-directory $(PROJECT_ROOT) -f $(PROJECT_ROOT)/docker-compose.yml

help:
	@echo "AI Assistant Shopify Project — Available Commands"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-prod       Start production stack (docker-compose.yml)"
	@echo "  make deploy-local      Start local debug stack (docker-compose.debug.yml)"
	@echo "  make deploy-local FULL=1  Full reset: wipe containers, reinstall deps, rebuild"
	@echo ""
	@echo "Local Development:"
	@echo "  make local-stop        Stop local containers"
	@echo "  make local-logs        Tail logs from local containers"
	@echo "  make local-shell-fe    SSH into running frontend container"
	@echo "  make local-shell-be    SSH into running backend container"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             Remove all containers and volumes"

deploy-prod:
	git pull
	$(COMPOSE_PROD) up -d

deploy-local:
ifdef FULL
	@echo "Full reset: stopping containers, removing volumes, rebuilding..."
	$(COMPOSE_DEBUG) down -v
	$(COMPOSE_DEBUG) build --no-cache
	$(COMPOSE_DEBUG) up -d
else
	$(COMPOSE_DEBUG) up -d
endif

local-stop:
	$(COMPOSE_DEBUG) down

local-logs:
	$(COMPOSE_DEBUG) logs -f

local-shell-fe:
	$(COMPOSE_DEBUG) exec app sh -c "cd /app/frontend && sh"

local-shell-be:
	$(COMPOSE_DEBUG) exec app sh -c "cd /app/backend && sh"

clean:
	$(COMPOSE_PROD) down -v
	$(COMPOSE_DEBUG) down -v
