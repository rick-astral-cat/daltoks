package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/ricar/daltoks/backend/internal/auth"
	"github.com/ricar/daltoks/backend/internal/db"
)

func main() {
	createUser := flag.String("create-user", "", "Create an internal user (format: username:password)")
	createEnv := flag.String("create-env", "", "Create an environment (format: 'Name:Description')")
	flag.Parse()

	// Initialize database
	err := db.InitDB("daltoks.db")
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err := db.DB.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Process CLI flags
	if *createUser != "" {
		auth.HandleCreateUser(*createUser)
		return
	}

	if *createEnv != "" {
		handleCreateEnv(*createEnv)
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

func handleCreateEnv(input string) {
	parts := strings.SplitN(input, ":", 2)
	name := parts[0]
	desc := ""
	if len(parts) > 1 {
		desc = parts[1]
	}

	if name == "" {
		log.Fatal("Environment name cannot be empty")
	}

	_, err := db.DB.Exec(`INSERT INTO environments (name, description) VALUES (?, ?)`, name, desc)
	if err != nil {
		log.Fatal("Error creating environment: ", err)
	}

	fmt.Printf("Environment '%s' created successfully.\n", name)
}
