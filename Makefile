# Makefile helpers

.PHONY: dev prod lint test audit audit-fix ci

dev:
	cd backend && npm run dev

prod:
	cd backend && npm run start:prod

lint:
	cd backend && npm run lint

test:
	cd backend && npm test || true

audit:
	cd backend && npm audit --audit-level=high || true

audit-fix:
	cd backend && npm audit fix || true

ci:
	@echo "Run CI locally:"
	@echo "- make lint"
	@echo "- make test"
	@echo "- make audit"
