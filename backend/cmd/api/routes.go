package main

import (
	"net/http"

	"github.com/ricar/daltoks/backend/internal/auth"
	"github.com/ricar/daltoks/backend/internal/environment"
	"github.com/ricar/daltoks/backend/internal/todo"
)

// registerRoutes centralizes all API route definitions.
func registerRoutes(mux *http.ServeMux) {
	// Public routes
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/login", auth.LoginHandler)

	// Protected routes
	mux.Handle("/api/me", auth.AuthMiddleware(http.HandlerFunc(auth.MeHandler)))
	mux.Handle("/api/logout", auth.AuthMiddleware(http.HandlerFunc(auth.LogoutHandler)))
	mux.Handle("/api/users", auth.AuthMiddleware(http.HandlerFunc(auth.ListUsersHandler)))

	// Environment routes
	mux.Handle("/api/environments", auth.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			environment.CreateEnvironmentHandler(w, r)
		} else {
			environment.ListEnvironmentsHandler(w, r)
		}
	})))
	mux.Handle("/api/environments/update", auth.AuthMiddleware(http.HandlerFunc(environment.UpdateEnvironmentHandler)))
	mux.Handle("/api/environments/delete", auth.AuthMiddleware(http.HandlerFunc(environment.SoftDeleteEnvironmentHandler)))
	mux.Handle("/api/environments/archived", auth.AuthMiddleware(http.HandlerFunc(environment.ListArchivedEnvironmentsHandler)))
	mux.Handle("/api/environments/restore", auth.AuthMiddleware(http.HandlerFunc(environment.RestoreEnvironmentHandler)))

	// Task routes
	mux.Handle("/api/tasks", auth.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			todo.CreateTaskHandler(w, r)
		} else {
			todo.GetTasksHandler(w, r)
		}
	})))

	mux.Handle("/api/tasks/update", auth.AuthMiddleware(http.HandlerFunc(todo.UpdateTaskHandler)))
	mux.Handle("/api/tasks/delete", auth.AuthMiddleware(http.HandlerFunc(todo.SoftDeleteTaskHandler)))
	mux.Handle("/api/tasks/archived", auth.AuthMiddleware(http.HandlerFunc(todo.ListArchivedTasksHandler)))
	mux.Handle("/api/tasks/restore", auth.AuthMiddleware(http.HandlerFunc(todo.RestoreTaskHandler)))

	mux.Handle("/api/tasks/updates", auth.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			todo.AddTaskUpdateHandler(w, r)
		} else {
			todo.GetTaskUpdatesHandler(w, r)
		}
	})))
}

// handleHealth provides a simple status check for the API.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}
