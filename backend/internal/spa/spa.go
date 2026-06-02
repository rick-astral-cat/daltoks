package spa

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// Handler serves the Single Page Application from an embedded filesystem.
type Handler struct {
	StaticFS embed.FS
	StaticPath string
	IndexPath  string
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Get the relative path from the root
	p := strings.TrimPrefix(r.URL.Path, "/")
	if p == "" {
		p = h.IndexPath
	}

	// Try to open the file in the embedded filesystem
	file, err := h.StaticFS.Open(path.Join(h.StaticPath, p))
	if err != nil {
		// If the file doesn't exist (and it's not an API call), serve index.html
		// This allows React Router to handle the routing on the client side.
		if !strings.HasPrefix(r.URL.Path, "/api") {
			index, err := h.StaticFS.ReadFile(path.Join(h.StaticPath, h.IndexPath))
			if err != nil {
				http.Error(w, "Index not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			w.Write(index)
			return
		}
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// Serve the file using the standard FileServer logic
	// We wrap the embedded FS in a sub-filesystem to point to the 'dist' folder
	subFS, _ := fs.Sub(h.StaticFS, h.StaticPath)
	http.FileServer(http.FS(subFS)).ServeHTTP(w, r)
}
