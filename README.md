# openbiblia

OpenBiblia scans XML Bible files in [bibles](bibles), generates translation metadata, and stores parsed verses in SQLite.

## Requirements

- Go 1.25+

## Run

```bash
go run .
```

## What it creates

- [data/bibles.json](data/bibles.json): list of languages and translation files
- [data/openbiblia.db](data/openbiblia.db): SQLite database
- Translations table: language + translation files
- Verses table: book, chapter, verse, text

## Notes

- XML source files are read from [bibles](bibles).
- DB and JSON paths are configured in [config/config.go](config/config.go).
