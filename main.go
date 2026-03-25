package main

import (
	"io/fs"
	"log"
	"path/filepath"
)

func main() {
	pathToBibleOSISData := "./bibles"
	err := filepath.WalkDir(pathToBibleOSISData, func(path string, d fs.DirEntry, err error) error {
		if !d.IsDir() {
			return filepath.SkipDir
		}

		println(d.Name())

		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
}
