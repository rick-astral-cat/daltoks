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
	ID            int64      `json:"id"`
	CreatorID     int64      `json:"creator_id"`
	AssigneeID    *int64     `json:"assignee_id"`
	EnvironmentID int64      `json:"environment_id"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
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
	Title         string `json:"title"`
	Description   string `json:"description"`
	AssigneeID    *int64 `json:"assignee_id"`
	EnvironmentID int64  `json:"environment_id"`
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

	if req.EnvironmentID == 0 {
		http.Error(w, "Environment ID is required", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO tasks (creator_id, assignee_id, environment_id, title, description) VALUES (?, ?, ?, ?, ?)`
	res, err := db.DB.Exec(query, creatorID, req.AssigneeID, req.EnvironmentID, req.Title, req.Description)
	if err != nil {
		log.Printf("Error creating task: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	taskID, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": taskID, "message": "Task created successfully"})
}

// GetTasksHandler returns all tasks, filtered by environment if provided.
func GetTasksHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	envID := r.URL.Query().Get("environment_id")
	
	query := `SELECT id, creator_id, assignee_id, environment_id, title, description, status, created_at, updated_at FROM tasks WHERE deleted_at IS NULL`
	var args []interface{}
	
	if envID != "" {
		query += ` AND environment_id = ?`
		args = append(args, envID)
	}
	
	query += ` ORDER BY created_at DESC`

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error fetching tasks: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.CreatorID, &t.AssigneeID, &t.EnvironmentID, &t.Title, &t.Description, &t.Status, &t.CreatedAt, &t.UpdatedAt); err != nil {
			log.Printf("Error scanning task: %v", err)
			continue
		}
		tasks = append(tasks, t)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

// AddTaskUpdateHandler adds a new comment/log to a task.
func AddTaskUpdateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authorID, ok := r.Context().Value(auth.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		TaskID  int64  `json:"task_id"`
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO task_updates (task_id, author_id, content) VALUES (?, ?, ?)`
	_, err := db.DB.Exec(query, req.TaskID, authorID, req.Content)
	if err != nil {
		log.Printf("Error adding task update: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Update the task's updated_at timestamp
	db.DB.Exec(`UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, req.TaskID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Update added successfully"})
}

// GetTaskUpdatesHandler returns all updates for a specific task.
func GetTaskUpdatesHandler(w http.ResponseWriter, r *http.Request) {
	taskID := r.URL.Query().Get("task_id")
	if taskID == "" {
		http.Error(w, "Missing task_id", http.StatusBadRequest)
		return
	}

	rows, err := db.DB.Query(`
		SELECT tu.id, tu.task_id, tu.author_id, tu.content, tu.created_at, u.username 
		FROM task_updates tu
		JOIN users u ON tu.author_id = u.id
		WHERE tu.task_id = ? 
		ORDER BY tu.created_at DESC`, taskID)
	if err != nil {
		log.Printf("Error fetching updates: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type UpdateWithAuthor struct {
		TaskUpdate
		AuthorName string `json:"author_name"`
	}

	updates := []UpdateWithAuthor{}
	for rows.Next() {
		var u UpdateWithAuthor
		if err := rows.Scan(&u.ID, &u.TaskID, &u.AuthorID, &u.Content, &u.CreatedAt, &u.AuthorName); err != nil {
			log.Printf("Error scanning update: %v", err)
			continue
		}
		updates = append(updates, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updates)
}

// UpdateTaskHandler handles updating task properties like status and assignee.
func UpdateTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	_, ok := r.Context().Value(auth.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	idVal, ok := body["id"].(float64)
	if !ok {
		http.Error(w, "Missing task id", http.StatusBadRequest)
		return
	}
	taskID := int64(idVal)

	if status, ok := body["status"].(string); ok {
		_, err := db.DB.Exec(`UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, status, taskID)
		if err != nil {
			log.Printf("Error updating task status: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}

	if assigneeVal, exists := body["assignee_id"]; exists {
		var err error
		if assigneeVal == nil {
			_, err = db.DB.Exec(`UPDATE tasks SET assignee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, taskID)
		} else {
			assigneeID := int64(assigneeVal.(float64))
			_, err = db.DB.Exec(`UPDATE tasks SET assignee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, assigneeID, taskID)
		}
		
		if err != nil {
			log.Printf("Error updating task assignee: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Task updated successfully"})
}

// SoftDeleteTaskHandler marks a task as deleted.
func SoftDeleteTaskHandler(w http.ResponseWriter, r *http.Request) {
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

	_, err := db.DB.Exec(`UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, req.ID)
	if err != nil {
		log.Printf("Error soft deleting task: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Task moved to trash"})
}

// ListArchivedTasksHandler returns all soft-deleted tasks.
func ListArchivedTasksHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`SELECT id, creator_id, assignee_id, environment_id, title, description, status, created_at, updated_at, deleted_at FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`)
	if err != nil {
		log.Printf("Error fetching archived tasks: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.CreatorID, &t.AssigneeID, &t.EnvironmentID, &t.Title, &t.Description, &t.Status, &t.CreatedAt, &t.UpdatedAt, &t.DeletedAt); err != nil {
			continue
		}
		tasks = append(tasks, t)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

// RestoreTaskHandler removes the deleted_at mark from a task.
func RestoreTaskHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID int64 `json:"id"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	_, err := db.DB.Exec(`UPDATE tasks SET deleted_at = NULL WHERE id = ?`, req.ID)
	if err != nil {
		http.Error(w, "Restore failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
