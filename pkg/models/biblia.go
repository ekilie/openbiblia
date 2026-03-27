package models

// BibleTranslation represents a language and its translations
type BibleTranslation struct {
	ID           uint          `gorm:"primaryKey" json:"-"`
	Lang         string        `json:"lang" gorm:"uniqueIndex"` // unique language
	Translations []Translation `json:"translations" gorm:"foreignKey:BibleTranslationID;constraint:OnDelete:CASCADE"`
}

// Translation represents a single Bible translation file
type Translation struct {
	ID                 uint   `gorm:"primaryKey" json:"-"`
	Name               string `json:"name"`
	Path               string `json:"path"`
	BibleTranslationID uint   `json:"-" gorm:"index"` // foreign key
}

// Verse represents one parsed verse from a translation file.
type Verse struct {
	ID            uint   `gorm:"primaryKey" json:"-"`
	TranslationID uint   `gorm:"index;not null"`
	Book          string `gorm:"index;not null"`
	Chapter       int    `gorm:"index;not null"`
	Verse         int    `gorm:"index;not null"`
	OsisID        string `gorm:"index"`
	Text          string `gorm:"type:text;not null"`
}

type Bibles struct {
	Bibles []BibleTranslation `json:"bibles"`
}
