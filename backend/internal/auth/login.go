package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/ricar/daltoks/backend/internal/db"
	"golang.org/x/crypto/bcrypt"
)

// LoginRequest defines the expected JSON payload for login.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginHandler handles the authentication process.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// 1. Fetch user from database
	var userID int64
	var passwordHash string
	query := `SELECT id, password_hash FROM users WHERE username = ?`
	err := db.DB.QueryRow(query, req.Username).Scan(&userID, &passwordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		log.Printf("Database error during login: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 2. Verify password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// 3. Create session
	token, err := CreateSession(userID)
	if err != nil {
		log.Printf("Session creation error: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 4. Set secure cookie
	// HttpOnly: prevents JavaScript from accessing the cookie (XSS protection)
	// SameSite=Lax: good balance between security and usability
	// Path=/api: restricts the cookie to API calls
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful"})
}
