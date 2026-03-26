package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

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
}

func main() {
	pathToBibleOSISData := "./bibles/"
	var bibles models.Bibles
	WriteBiblesJSON(&bibles, pathToBibleOSISData, config.BiblesJSONPath)
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
