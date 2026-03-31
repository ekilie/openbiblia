package models

// BibleTranslation represents a language and its translations
type BibleTranslation struct {
	Lang         string        `json:"lang"`
	Translations []Translation `json:"translations"`
}

// Translation represents a single Bible translation in the manifest
type Translation struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DownloadURL string `json:"download_url"`
	Size        int64  `json:"size"`
	Version     int    `json:"version"`
	Checksum    string `json:"checksum"`

	// Internal — not serialized to manifest JSON
	XMLPath string `json:"-"`
	DBPath  string `json:"-"`
}

// Verse represents one parsed verse from a translation file.
type Verse struct {
	ID      uint   `gorm:"primaryKey"`
	Book    string `gorm:"index:idx_book_chapter_verse;not null"`
	Chapter int    `gorm:"index:idx_book_chapter_verse;not null"`
	Verse   int    `gorm:"index:idx_book_chapter_verse;not null"`
	OsisID  string `gorm:"index"`
	Text    string `gorm:"type:text;not null"`
}

// Meta stores key-value metadata inside each per-translation DB.
type Meta struct {
	Key   string `gorm:"primaryKey"`
	Value string
}

type Bibles struct {
	Bibles []BibleTranslation `json:"bibles"`
}
