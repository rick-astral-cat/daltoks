package todo

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/ricar/daltoks/backend/internal/auth"
	"github.com/ricar/daltoks/backend/internal/db"
)

// Task represents the task model in the database.
type Task struct {
	ID          int64     `json:"id"`
	CreatorID   int64     `json:"creator_id"`
	AssigneeID  *int64    `json:"assignee_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TaskUpdate represents a log update for a task.
type TaskUpdate struct {
	ID        int64     `json:"id"`
	TaskID    int64     `json:"task_id"`
	AuthorID  int64     `json:"author_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateTaskRequest defines the payload to create a task.
type CreateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	AssigneeID  *int64 `json:"assignee_id"`
}

// CreateTaskHandler handles task creation.
func CreateTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	creatorID, ok := r.Context().Value(auth.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO tasks (creator_id, assignee_id, title, description) VALUES (?, ?, ?, ?)`
	res, err := db.DB.Exec(query, creatorID, req.AssigneeID, req.Title, req.Description)
	if err != nil {
		log.Printf("Error creating task: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	taskID, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": taskID, "message": "Task created successfully"})
}

// GetTasksHandler returns all tasks.
func GetTasksHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT id, creator_id, assignee_id, title, description, status, created_at, updated_at FROM tasks ORDER BY created_at DESC`)
	if err != nil {
		log.Printf("Error fetching tasks: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.CreatorID, &t.AssigneeID, &t.Title, &t.Description, &t.Status, &t.CreatedAt, &t.UpdatedAt); err != nil {
			log.Printf("Error scanning task: %v", err)
			continue
		}
		tasks = append(tasks, t)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}
