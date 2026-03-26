package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
)



type BibleTranslation struct {
	Lang         string        `json:"lang"`
	Translations []Translation `json:"translations,omitempty"`
}

type Translation struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type Bibles struct {
	Bibles []BibleTranslation `json:"bibles"`
}

func main() {
	pathToBibleOSISData := "./bibles/"
	var bibles Bibles
	EncodeToBiblesListJson(bibles,pathToBibleOSISData,"./data/bibles.json")
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

// EncodeToBiblesListJson reads the directory structure of the provided path to Bible OSIS data and encodes it into a JSON file with the structure defined by the Bibles, BibleTranslation, and Translation structs. Each language directory is expected to contain translation files, and the resulting JSON will list all available translations for each language.
func EncodeToBiblesListJson(bibles Bibles, pathToBibleOSISData string, outputFilePath string) {
	biblesJsonFile, err := os.Create(outputFilePath)
	if err != nil {
		log.Fatal(err)
	}
	defer biblesJsonFile.Close()


	err = filepath.WalkDir(pathToBibleOSISData, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() || path == pathToBibleOSISData {
			return nil
		}
		var Translations []Translation
		err = filepath.WalkDir(path, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() || path == pathToBibleOSISData {
				return nil
			}
			translation := Translation{
				Name: d.Name(),
				Path: path,
			}
			Translations = append(Translations, translation)
			return nil
		})
		if err != nil {
			return err
		}
		translation := BibleTranslation{
			Lang:         d.Name(),
			Translations: Translations,
		}
		bibles.Bibles = append(bibles.Bibles, translation)
		println(d.Name(), translation.Lang)
		return nil
	})

	if err != nil {
		log.Fatal(err)
	}
	encoder := json.NewEncoder(biblesJsonFile)
	encoder.SetIndent("", "  ")
	err = encoder.Encode(&bibles)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Done")
}
