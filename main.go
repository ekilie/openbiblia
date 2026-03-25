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
		if !d.IsDir() {
			return filepath.SkipDir
		}

		println("===========", d.Name())
		errr := filepath.WalkDir(d.Name(), func(path string, b fs.DirEntry, err error) error {
			if b.IsDir() {
				return filepath.SkipDir
			}

			println("	", b.Name())

			return nil
		})

		return errr
	})
	if err != nil {
		log.Fatal(err)
	}
}
