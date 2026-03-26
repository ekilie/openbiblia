package main

import (
	"fmt"
	"io/fs"
	"log"
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
	
	var bibles Bibles
	err := filepath.WalkDir(pathToBibleOSISData, func(path string, d fs.DirEntry, err error) error {
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
		println(d.Name(),translation.Lang)
		return nil
	})

	fmt.Printf("%+v\n", bibles)
	if err != nil {
		log.Fatal(err)
	}
}
