package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ricar/daltoks/backend/internal/auth"
	"github.com/ricar/daltoks/backend/internal/db"
)

func main() {
	createUser := flag.String("create-user", "", "Create an internal user (format: username:password)")
	flag.Parse()

	// Initialize database
	// Use a relative path that assumes the application is run from the directory where the DB resides.
	// For local development in GoLand, ensure the Working Directory is set to the 'backend' folder.
	err := db.InitDB("daltoks.db")
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err := db.DB.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Process internal user creation if flag is provided
	if *createUser != "" {
		auth.HandleCreateUser(*createUser)
		return
	}

	// 1. Initialize custom Mux (Multiplexer)
	mux := http.NewServeMux()

	// Register all routes from routes.go
	registerRoutes(mux)

	// 2. Configure a structured HTTP Server
	// Setting timeouts is crucial for a 1GB RAM Debian server to prevent resource exhaustion
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 3. Start the server in a non-blocking way (Goroutine)
	go func() {
		log.Println("Backend server starting on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// 4. Implement Graceful Shutdown
	// Create a channel to listen for OS signals (SIGINT, SIGTERM)
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Wait for the signal
	<-stop
	log.Println("Shutdown signal received, shutting down gracefully...")

	// Create a context with a timeout for the shutdown process
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped cleanly")
}
