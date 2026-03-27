package db

import (
	"github.com/ekilie/openbiblia/config"
	"github.com/ekilie/openbiblia/pkg/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// Open opens the database connection to the Bible translations database.
func Open() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(config.DBPath), &gorm.Config{})
	return db, err
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.BibleTranslation{}, &models.Translation{}, &models.Verse{})
}
