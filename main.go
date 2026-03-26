package main

import (
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

type  BibleTranslation struct {
	Lang string `json:"lang"`
	Translations []Translation `json:"translations"`
}

type Translation struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

func main() {
	pathToBibleOSISData := "./bibles/"
	err := filepath.WalkDir(pathToBibleOSISData, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() {
			println("--------",d.Name())
		}else{
			println("---",d.Name())
		}

		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
}
