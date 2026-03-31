package db

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ekilie/openbiblia/config"
	"github.com/ekilie/openbiblia/pkg/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// OpenTranslation opens (or creates) a per-translation SQLite database.
// The DB file lives at data/dbs/{lang}/{translationName}.db
func OpenTranslation(lang, translationName string) (*gorm.DB, error) {
	dbPath := TranslationDBPath(lang, translationName)

	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create db dir %s: %w", dir, err)
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open db %s: %w", dbPath, err)
	}
	return db, nil
}

// MigrateTranslation runs auto-migration for a per-translation database.
func MigrateTranslation(db *gorm.DB) error {
	return db.AutoMigrate(&models.Verse{})
}

// TranslationDBPath returns the file path for a translation's database.
func TranslationDBPath(lang, translationName string) string {
	name := strings.TrimSuffix(translationName, filepath.Ext(translationName))
	return filepath.Join(config.DBDir, lang, name+".db")
}
