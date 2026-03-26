package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
)

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
	biblesJsonFile, err := os.Create("data/bibles.json")
	if err != nil {
		log.Fatal(err)
	}
	defer biblesJsonFile.Close()

	var bibles Bibles
	// err = json.NewDecoder(biblesJsonFile).Decode(&bibles)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	fmt.Printf("%+v\n", bibles)

	err = filepath.WalkDir(pathToBibleOSISData, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() || path == pathToBibleOSISData {
			return nil
		}
		translation := BibleTranslation{
			Lang: d.Name(),
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
