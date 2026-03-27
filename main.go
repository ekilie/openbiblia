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

var (
	DB *gorm.DB
)

func init() {
	var err error
	DB, err = db.Open()
	if err != nil {
		log.Fatal(err)
	}
	err = db.Migrate(DB)
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	pathToBibleOSISData := "./bibles/"
	var bibles models.Bibles
	WriteBiblesJSON(&bibles, pathToBibleOSISData, config.BiblesJSONPath)
	WriteBiblesToDB(&bibles, DB)
	ParseAndSaveBibleData(DB)
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

// WriteBiblesJSON reads the directory structure of the provided path to Bible OSIS data and encodes it into a JSON file with the structure defined by the Bibles, BibleTranslation, and Translation structs. Each language directory is expected to contain translation files, and the resulting JSON will list all available translations for each language.
func WriteBiblesJSON(bibles *models.Bibles, pathToBibleOSISData string, outputFilePath string) {
	biblesJsonFile, err := os.Create(outputFilePath)
	if err != nil {
		log.Fatal(err)
	}
	defer biblesJsonFile.Close()

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
				Name: f.Name(),
				Path: filepath.Join(pathToBibleOSISData, lang, f.Name()),
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
	fmt.Println("Done")
}

func WriteBiblesToDB(bibles *models.Bibles, db *gorm.DB) {
	for _, bible := range bibles.Bibles {
		err := db.Create(&bible).Error
		if err != nil {
			log.Printf("failed to insert bible for lang %s: %v", bible.Lang, err)
		}
	}
}

// ParseAndSaveBibleData parses all translation XML files and stores verse rows in SQLite.
func ParseAndSaveBibleData(db *gorm.DB) {
	var translations []models.Translation
	if err := db.Find(&translations).Error; err != nil {
		log.Printf("failed to load translations: %v", err)
		return
	}

	for _, translation := range translations {
		verses, err := ParseOSISVerses(translation.Path)
		if err != nil {
			log.Printf("failed to parse %s: %v", translation.Path, err)
			continue
		}

		for i := range verses {
			verses[i].TranslationID = translation.ID
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Where("translation_id = ?", translation.ID).Delete(&models.Verse{}).Error; err != nil {
				return err
			}

			const batchSize = 1000
			for start := 0; start < len(verses); start += batchSize {
				end := start + batchSize
				if end > len(verses) {
					end = len(verses)
				}
				batch := verses[start:end]
				if err := tx.Create(&batch).Error; err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			log.Printf("failed to save verses for %s: %v", translation.Path, err)
			continue
		}

		log.Printf("saved %d verses from %s", len(verses), translation.Path)
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
