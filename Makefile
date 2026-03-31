.PHONY: build release clean

RELEASE_TAG := v1
REPO := ekilie/openbiblia
DB_DIR := data/dbs

# Build the Go preprocessor and generate all .db files + bibles.json manifest
build:
	go run main.go

# Remove all generated databases
clean:
	rm -rf $(DB_DIR)

# Build DBs, then create a GitHub release and upload all .db files as assets.
# Requires: gh CLI (https://cli.github.com) authenticated.
release: build
	@echo "Creating GitHub release $(RELEASE_TAG)..."
	gh release create $(RELEASE_TAG) \
		--repo $(REPO) \
		--title "Bible databases $(RELEASE_TAG)" \
		--notes "Auto-generated SQLite databases for all translations." \
		--latest \
	|| echo "Release $(RELEASE_TAG) already exists, uploading assets..."
	@echo "Uploading .db files..."
	@mkdir -p /tmp/openbiblia-upload
	@find $(DB_DIR) -name '*.db' | while read db; do \
		lang=$$(basename $$(dirname "$$db")); \
		name=$$(basename "$$db"); \
		asset="$$lang-$$name"; \
		cp "$$db" "/tmp/openbiblia-upload/$$asset"; \
		echo "  $$asset"; \
		gh release upload $(RELEASE_TAG) "/tmp/openbiblia-upload/$$asset" \
			--repo $(REPO) --clobber; \
	done
	@rm -rf /tmp/openbiblia-upload
	@echo "Done. Assets uploaded to https://github.com/$(REPO)/releases/tag/$(RELEASE_TAG)"
