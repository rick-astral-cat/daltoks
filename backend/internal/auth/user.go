package auth

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/ricar/daltoks/backend/internal/db"
	"golang.org/x/crypto/bcrypt"
)

// UserResponse defines the JSON structure for user identity.
type UserResponse struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

// MeHandler returns the profile of the currently authenticated user.
func MeHandler(w http.ResponseWriter, r *http.Request) {
	// The UserID is retrieved from the context, where the middleware placed it.
	userID, ok := r.Context().Value(UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user UserResponse
	query := `SELECT id, username, created_at FROM users WHERE id = ?`
	err := db.DB.QueryRow(query, userID).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if err != nil {
		log.Printf("Error fetching user data for /me: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// HandleCreateUser creates a new internal user via CLI.
func HandleCreateUser(input string) {
	parts := strings.SplitN(input, ":", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		log.Fatal("Invalid format. Use -create-user username:password (use quotes for special characters)")
	}

	username := parts[0]
	password := parts[1]

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Error hashing password: ", err)
	}

	_, err = db.DB.Exec("INSERT INTO users (username, password_hash) VALUES (?, ?)", username, string(hashedPassword))
	if err != nil {
		log.Fatal("Error inserting user (does it already exist?): ", err)
	}

	fmt.Printf("User '%s' created successfully.\n", username)
}
