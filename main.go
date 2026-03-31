package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/ekilie/openbiblia/config"
	"github.com/ekilie/openbiblia/pkg/db"
	"github.com/ekilie/openbiblia/pkg/models"
	"gorm.io/gorm"
)

func main() {
	pathToBibleOSISData := "./bibles/"

	// Step 1: scan XML files and build per-translation SQLite databases
	bibles := buildAllDatabases(pathToBibleOSISData)

	// Step 2: compute checksums/sizes and write the final manifest
	writeManifest(bibles, config.BiblesJSONPath)

	fmt.Println("Done")
}

// buildAllDatabases walks the bibles/ directory tree, parses each XML,
// writes a per-translation .db file with meta table, and returns the manifest data.
func buildAllDatabases(root string) models.Bibles {
	var bibles models.Bibles

	entries, err := os.ReadDir(root)
	if err != nil {
		log.Fatal(err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		lang := entry.Name()
		files, err := os.ReadDir(filepath.Join(root, lang))
		if err != nil {
			log.Fatalf("failed to read dir %s: %v", lang, err)
		}

		var translations []models.Translation
		for _, f := range files {
			if f.IsDir() {
				continue
			}
			xmlPath := filepath.Join(root, lang, f.Name())
			id := db.TranslationID(f.Name())
			dbPath := db.TranslationDBPath(lang, f.Name())

			log.Printf("processing %s / %s", lang, f.Name())

			if err := buildOneDB(lang, id, xmlPath, dbPath); err != nil {
				log.Printf("SKIP %s/%s: %v", lang, f.Name(), err)
				continue
			}

			// Compute checksum and size after DB is written
			checksum, size, err := fileChecksumAndSize(dbPath)
			if err != nil {
				log.Printf("SKIP checksum %s: %v", dbPath, err)
				continue
			}

			translations = append(translations, models.Translation{
				ID:          id,
				Name:        id,
				DownloadURL: fmt.Sprintf("https://github.com/%s/releases/latest/download/%s-%s.db", config.GitHubRepo, lang, id),
				Size:        size,
				Version:     config.SchemaVersion,
				Checksum:    checksum,
				XMLPath:     xmlPath,
				DBPath:      dbPath,
			})
		}

		if len(translations) > 0 {
			bibles.Bibles = append(bibles.Bibles, models.BibleTranslation{
				Lang:         lang,
				Translations: translations,
			})
		}
	}

	return bibles
}

// buildOneDB creates a single translation DB: migrate, write meta, parse XML, insert verses.
func buildOneDB(lang, id, xmlPath, dbPath string) error {
	// Remove old DB if it exists so we get a clean build
	os.Remove(dbPath)

	tdb, err := db.OpenTranslation(lang, id+".xml") // reuses naming convention
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}
	defer func() {
		sqlDB, _ := tdb.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}()

	if err := db.MigrateTranslation(tdb); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	// Write meta
	if err := db.WriteMeta(tdb, map[string]string{
		"translation": id,
		"lang":        lang,
		"version":     strconv.Itoa(config.SchemaVersion),
	}); err != nil {
		return fmt.Errorf("write meta: %w", err)
	}

	// Parse XML
	verses, err := ParseOSISVerses(xmlPath)
	if err != nil {
		return fmt.Errorf("parse xml: %w", err)
	}

	// Batch insert inside a transaction
	err = tdb.Transaction(func(tx *gorm.DB) error {
		const batchSize = 1000
		for start := 0; start < len(verses); start += batchSize {
			end := min(start + batchSize, len(verses))
			if err := tx.Create(verses[start:end]).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("insert verses: %w", err)
	}

	log.Printf("  saved %d verses → %s", len(verses), dbPath)
	return nil
}

// fileChecksumAndSize returns the sha256 hex digest and byte size of a file.
func fileChecksumAndSize(path string) (string, int64, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()

	h := sha256.New()
	size, err := io.Copy(h, f)
	if err != nil {
		return "", 0, err
	}
	return "sha256-" + hex.EncodeToString(h.Sum(nil)), size, nil
}

// writeManifest serializes the bibles manifest to JSON.
func writeManifest(bibles models.Bibles, path string) {
	data, err := json.MarshalIndent(bibles, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		log.Fatal(err)
	}
	log.Printf("wrote manifest → %s", path)
}

// ParseOSISVerses streams one OSIS XML file and returns parsed verses.
func ParseOSISVerses(filePath string) ([]models.Verse, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	decoder := xml.NewDecoder(f)
	verses := make([]models.Verse, 0, 32000)

	var currentBook string
	var currentChapter int

	for {
		tok, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		start, ok := tok.(xml.StartElement)
		if !ok {
			continue
		}

		switch start.Name.Local {
		case "div":
			if attrValue(start.Attr, "type") == "book" {
				currentBook = attrValue(start.Attr, "osisID")
			}
		case "chapter":
			book, chapter := parseChapterOSISID(attrValue(start.Attr, "osisID"))
			if book != "" {
				currentBook = book
			}
			if chapter > 0 {
				currentChapter = chapter
			}
		case "verse":
			osisID := attrValue(start.Attr, "osisID")
			book, chapter, verseNum := parseVerseOSISID(osisID)
			if book == "" {
				book = currentBook
			}
			if chapter == 0 {
				chapter = currentChapter
			}

			text, err := readElementText(decoder)
			if err != nil {
				return nil, err
			}

			if strings.TrimSpace(text) == "" {
				continue
			}

			verses = append(verses, models.Verse{
				Book:    book,
				Chapter: chapter,
				Verse:   verseNum,
				OsisID:  osisID,
				Text:    text,
			})
		}
	}

	return verses, nil
}

func readElementText(decoder *xml.Decoder) (string, error) {
	var b strings.Builder
	depth := 1

	for depth > 0 {
		tok, err := decoder.Token()
		if err != nil {
			return "", err
		}

		switch t := tok.(type) {
		case xml.StartElement:
			depth++
		case xml.EndElement:
			depth--
		case xml.CharData:
			b.Write([]byte(t))
		}
	}

	return strings.Join(strings.Fields(b.String()), " "), nil
}

func attrValue(attrs []xml.Attr, localName string) string {
	for _, a := range attrs {
		if a.Name.Local == localName {
			return a.Value
		}
	}
	return ""
}

func parseChapterOSISID(osisID string) (string, int) {
	parts := strings.Split(osisID, ".")
	if len(parts) < 2 {
		return "", 0
	}

	chapter, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		return strings.Join(parts[:len(parts)-1], "."), 0
	}

	return strings.Join(parts[:len(parts)-1], "."), chapter
}

func parseVerseOSISID(osisID string) (string, int, int) {
	parts := strings.Split(osisID, ".")
	if len(parts) < 3 {
		return "", 0, 0
	}

	chapter, err := strconv.Atoi(parts[len(parts)-2])
	if err != nil {
		chapter = 0
	}

	verse, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		verse = 0
	}

	return strings.Join(parts[:len(parts)-2], "."), chapter, verse
}
