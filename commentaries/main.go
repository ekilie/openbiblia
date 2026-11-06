package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Commentary is one entry in the commentaries manifest.
type Commentary struct {
	Name        string `json:"name"`
	DownloadURL string `json:"download_url"`
}

// Manifest is the top-level structure of commentaries.json.
type Manifest struct {
	Commentaries []Commentary `json:"commentaries"`
}

// findManifest returns the first manifest path that exists. This lets the
// downloader run either from the repo root or from the commentaries directory.
func findManifest() string {
	candidates := []string{
		filepath.Join("commentaries", "commentaries.json"),
		"commentaries.json",
	}

	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	return candidates[0]
}

// loadManifest reads and validates the commentaries JSON file.
func loadManifest(path string) ([]Commentary, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}

	var manifest Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}

	if len(manifest.Commentaries) == 0 {
		return nil, fmt.Errorf("manifest contains no commentaries")
	}

	for i, c := range manifest.Commentaries {
		if c.Name == "" {
			return nil, fmt.Errorf("commentary %d: name is empty", i)
		}
		if c.DownloadURL == "" {
			return nil, fmt.Errorf("commentary %q: download_url is empty", c.Name)
		}
	}

	return manifest.Commentaries, nil
}

func downloadFile(url, dest string) error {
	client := &http.Client{Timeout: 10 * time.Minute}

	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func main() {
	manifestPath := flag.String("json", findManifest(), "path to the commentaries manifest")
	downloadDir := flag.String("out", "", "directory to save downloaded PDFs (default: data next to the manifest)")
	flag.Parse()

	commentaries, err := loadManifest(*manifestPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load %s: %v\n", *manifestPath, err)
		os.Exit(1)
	}

	outDir := *downloadDir
	if outDir == "" {
		outDir = filepath.Join(filepath.Dir(*manifestPath), "data")
	}

	if err := os.MkdirAll(outDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create directory: %v\n", err)
		os.Exit(1)
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, 5) // Limit concurrency to 5

	fmt.Printf("Starting download of %d Bible commentaries...\n", len(commentaries))

	for _, commentary := range commentaries {
		wg.Add(1)
		go func(c Commentary) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			name := filepath.Base(c.Name)
			localPath := filepath.Join(outDir, name)

			// Skip if already downloaded
			if _, err := os.Stat(localPath); err == nil {
				fmt.Printf("✓ Already exists: %s\n", name)
				return
			}

			fmt.Printf("Downloading: %s\n", name)
			if err := downloadFile(c.DownloadURL, localPath); err != nil {
				fmt.Printf("✗ Failed %s: %v\n", name, err)
			} else {
				fmt.Printf("✓ Downloaded: %s\n", name)
			}

			time.Sleep(300 * time.Millisecond) // Be polite to the server
		}(commentary)
	}

	wg.Wait()
	fmt.Printf("\nDownload complete! Files saved to %s/\n", outDir)
}
