package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var baseURL = "https://www.bible-commentaries.com/source/johnschultz/"

// List of all available PDFs (extracted from the site https://www.bible-commentaries.com)
var commentaries = []string{
	"BC_Genesis.pdf",
	"BC_Exodus.pdf",
	"BC_Leviticus.pdf",
	"BC_Numbers.pdf",
	"BC_Deuteronomy.pdf",
	"BC_Joshua.pdf",
	"BC_Judges.pdf",
	"BC_Ruth.pdf",
	"BC_FirstSamuel.pdf",
	"BC_2Sam.pdf",
	"BC_1Kings.pdf",
	"BC_2KingsRevised.pdf",
	"BC_1Chron.pdf",
	"BC_2Chron.pdf",
	"BC_Ezra.pdf",
	"BC_Nehemiah.pdf",
	"BC_Esther.pdf",
	"BC_Job.pdf",
	"BC_Psalms_001-041.pdf",
	"BC_Psalms_042-072.pdf",
	"BC_Psalms_073-089.pdf",
	"BC_Psalms_090-106.pdf",
	"BC_Psalms_107-150.pdf",
	"BC_proverbs.pdf",
	"BC_Ecclesiastes.pdf",
	"BC_Song-of-songs.pdf",
	"BC_Isaiah.pdf",
	"BC_JEREMIAH.pdf",
	"BC_Lamentations.pdf",
	"BC_Ezekiel.pdf",
	"BC_Daniel.pdf",
	"BC_Hosea.pdf",
	"BC_Joel.pdf",
	"BC_Amos.pdf",
	"BC_Obadiah.pdf",
	"BC_Jonah.pdf",
	"BC_Micah.pdf",
	"BC_Nahum.pdf",
	"BC_Habakkuk.pdf",
	"BC_Zephaniah.pdf",
	"BC_Haggai.pdf",
	"BC_Zechariah.pdf",
	"BC_Malachi.pdf",
	"BC_Matthew.pdf",
	"BC_Mark.pdf",
	"BC_Luke.pdf",
	"BC_John.pdf",
	"BC_Acts.pdf",
	"BC_Romans.pdf",
	"BC_1Corinthians.pdf",
	"BC_2Corinthians.pdf",
	"BC_Galatians.pdf",
	"BC_Phi-Col-Eph.pdf",
	"BC_1-Thessalonians.pdf",
	"BC_2-Thessalonians.pdf",
	"BC_1_Timothy.pdf",
	"BC_2_Timothy.pdf",
	"BC_Titus.pdf",
	"BC_PhilemonR.pdf",
	"BC_Hebrews.pdf",
	"BC_James.pdf",
	"BC_1Peter.pdf",
	"BC_2_Peter.pdf",
	"BC_1John.pdf",
	"BC_2_John.pdf",
	"BC_3_John.pdf",
	"BC_Jude.pdf",
	"BC_Revelation.pdf",
	"BC_on-David.pdf", // Additional work
}

func downloadFile(url, filepath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func main() {
	// Create downloads directory
	downloadDir := "data"
	if err := os.MkdirAll(downloadDir, 0755); err != nil {
		fmt.Printf("Failed to create directory: %v\n", err)
		return
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, 5) // Limit concurrency to 5

	fmt.Println("Starting download of all Bible Commentaries by John Schultz...")

	for _, filename := range commentaries {
		wg.Add(1)
		go func(name string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			url := baseURL + name
			localPath := filepath.Join(downloadDir, name)

			// Skip if already downloaded
			if _, err := os.Stat(localPath); err == nil {
				fmt.Printf("✓ Already exists: %s\n", name)
				return
			}

			fmt.Printf("Downloading: %s\n", name)
			err := downloadFile(url, localPath)
			if err != nil {
				fmt.Printf("✗ Failed %s: %v\n", name, err)
			} else {
				fmt.Printf("✓ Downloaded: %s\n", name)
			}

			time.Sleep(300 * time.Millisecond) // Be polite to the server
		}(filename)
	}

	wg.Wait()
	fmt.Printf("%s", "\nDownload complete! All files saved to ./" + downloadDir + "/\n")
}
