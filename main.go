package main

import (
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
	var bibles models.Bibles
	WriteBiblesJSON(&bibles, pathToBibleOSISData, config.BiblesJSONPath)
	ParseAndSaveAllBibles(&bibles)
	fmt.Println("Done")
}

// {
// 	bibles: [
// 		{"lang": "en", "translations": [
// 			{"name": "KJV", "path": "kjv.xml"},
// 			{"name": "NIV", "path": "niv.xml"}
// 		]},
// 		{"lang": "sw", "translations": [
// 			{"name": "KJV", "path": "kjv.xml"},
// 			{"name": "NIV", "path": "niv.xml"}
// 		]}
// 	]
// }

// WriteBiblesJSON reads the directory structure of the provided path to Bible OSIS data
// and encodes it into a JSON file. Each translation entry includes its db_path.
func WriteBiblesJSON(bibles *models.Bibles, pathToBibleOSISData string, outputFilePath string) {
	entries, err := os.ReadDir(pathToBibleOSISData)
	if err != nil {
		log.Fatal(err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		lang := entry.Name()
		files, err := os.ReadDir(filepath.Join(pathToBibleOSISData, lang))
		if err != nil {
			log.Fatalf("failed to read dir %s: %v", lang, err)
		}
		var translations []models.Translation
		for _, f := range files {
			if f.IsDir() {
				continue
			}
			translations = append(translations, models.Translation{
				Name:   f.Name(),
				Path:   filepath.Join(pathToBibleOSISData, lang, f.Name()),
				DBPath: db.TranslationDBPath(lang, f.Name()),
			})
		}
		bibles.Bibles = append(bibles.Bibles, models.BibleTranslation{
			Lang:         lang,
			Translations: translations,
		})
	}
	data, err := json.MarshalIndent(bibles, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	err = os.WriteFile(outputFilePath, data, 0644)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("wrote", outputFilePath)
}

// ParseAndSaveAllBibles iterates every translation, creates a per-translation
// SQLite database, parses the XML, and stores the verses.
func ParseAndSaveAllBibles(bibles *models.Bibles) {
	for _, bible := range bibles.Bibles {
		for _, translation := range bible.Translations {
			log.Printf("processing %s / %s", bible.Lang, translation.Name)

			tdb, err := db.OpenTranslation(bible.Lang, translation.Name)
			if err != nil {
				log.Printf("failed to open db for %s/%s: %v", bible.Lang, translation.Name, err)
				continue
			}
			if err := db.MigrateTranslation(tdb); err != nil {
				log.Printf("failed to migrate db for %s/%s: %v", bible.Lang, translation.Name, err)
				continue
			}

			verses, err := ParseOSISVerses(translation.Path)
			if err != nil {
				log.Printf("failed to parse %s: %v", translation.Path, err)
				continue
			}

			err = tdb.Transaction(func(tx *gorm.DB) error {
				if err := tx.Where("1=1").Delete(&models.Verse{}).Error; err != nil {
					return err
				}
				const batchSize = 1000
				for start := 0; start < len(verses); start += batchSize {
					end := start + batchSize
					if end > len(verses) {
						end = len(verses)
					}
					if err := tx.Create(verses[start:end]).Error; err != nil {
						return err
					}
				}
				return nil
			})
			if err != nil {
				log.Printf("failed to save verses for %s/%s: %v", bible.Lang, translation.Name, err)
				continue
			}

			sqlDB, _ := tdb.DB()
			if sqlDB != nil {
				sqlDB.Close()
			}

			log.Printf("saved %d verses → %s", len(verses), translation.DBPath)
		}
	}
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
