package main

import (
	"net/http"
)

// registerRoutes centralizes all API route definitions.
func registerRoutes(mux *http.ServeMux) {
	// Health check
	mux.HandleFunc("/api/health", handleHealth)

	// Auth routes (placeholders for next steps)
	// mux.HandleFunc("/api/login", auth.LoginHandler)
}

// handleHealth provides a simple status check for the API.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}
