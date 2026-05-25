package main

import (
	"net/http"

	"github.com/ricar/daltoks/backend/internal/auth"
)

// registerRoutes centralizes all API route definitions.
func registerRoutes(mux *http.ServeMux) {
	// Public routes
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/login", auth.LoginHandler)

	// Protected routes
	mux.Handle("/api/me", auth.AuthMiddleware(http.HandlerFunc(auth.MeHandler)))
	mux.Handle("/api/logout", auth.AuthMiddleware(http.HandlerFunc(auth.LogoutHandler)))
}

// handleHealth provides a simple status check for the API.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}
