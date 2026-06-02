package environment

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/ricar/daltoks/backend/internal/db"
)

// Environment represents a task category/platform.
type Environment struct {
	ID          int64      `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

// ListEnvironmentsHandler returns all active environments.
func ListEnvironmentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT id, name, description, created_at FROM environments WHERE deleted_at IS NULL ORDER BY name ASC`)
	if err != nil {
		log.Printf("Error fetching environments: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	envs := []Environment{}
	for rows.Next() {
		var e Environment
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.CreatedAt); err != nil {
			continue
		}
		envs = append(envs, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(envs)
}

// CreateEnvironmentHandler creates a new platform category.
func CreateEnvironmentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	res, err := db.DB.Exec(`INSERT INTO environments (name, description) VALUES (?, ?)`, req.Name, req.Description)
	if err != nil {
		log.Printf("Error creating environment: %v", err)
		http.Error(w, "Database error (maybe duplicate name?)", http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Environment created successfully"})
}

// SoftDeleteEnvironmentHandler marks an environment as deleted.
func SoftDeleteEnvironmentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// We use SET_NULL or RESTRICT at DB level, but logic-wise we just mark it.
	// Since we have RESTRICT in schema.hcl, this will fail if tasks exist.
	_, err := db.DB.Exec(`UPDATE environments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, req.ID)
	if err != nil {
		log.Printf("Error deleting environment: %v", err)
		http.Error(w, "Cannot delete environment (ensure it has no tasks)", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Environment deleted successfully"})
}

// ListArchivedEnvironmentsHandler returns all soft-deleted environments.
func ListArchivedEnvironmentsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`SELECT id, name, description, deleted_at FROM environments WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`)
	if err != nil {
		log.Printf("Error fetching archived environments: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	envs := []Environment{}
	for rows.Next() {
		var e Environment
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.DeletedAt); err != nil {
			continue
		}
		envs = append(envs, e)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(envs)
}

// RestoreEnvironmentHandler removes the deleted_at mark.
func RestoreEnvironmentHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID int64 `json:"id"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	_, err := db.DB.Exec(`UPDATE environments SET deleted_at = NULL WHERE id = ?`, req.ID)
	if err != nil {
		http.Error(w, "Restore failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// UpdateEnvironmentHandler updates the name or description of an environment.
func UpdateEnvironmentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ID          int64  `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	_, err := db.DB.Exec(`UPDATE environments SET name = ?, description = ? WHERE id = ?`, req.Name, req.Description, req.ID)
	if err != nil {
		log.Printf("Error updating environment: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Environment updated successfully"})
}
