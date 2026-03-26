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

type Bibles struct {
	Bibles []BibleTranslation `json:"bibles"`
}
