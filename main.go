package main

import (
	"io/fs"
	"log"
	"path/filepath"
)

// I want to walk the bibles dir and walk each lang recording the translations list in a json file
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
