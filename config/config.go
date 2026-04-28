package config

const (
	BiblesJSONPath = "./data/bibles.json"
	DBDir          = "./data/dbs"
	// GitHubRepo is the GitHub repository path used for release asset URLs.
	GitHubRepo = "ekilie/openbiblia"
	// ReleaseTag is the git tag used for the current release of DB assets.
	ReleaseTag = "v1"
	// SchemaVersion is stamped into every generated DB for client-side compatibility checks.
	SchemaVersion = 1
)
