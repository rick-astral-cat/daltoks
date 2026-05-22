package auth

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/ricar/daltoks/backend/internal/db"
)

// Session represents a user session stored in the database.
type Session struct {
	ID        string
	UserID    int64
	Token     string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// CreateSession generates a new session for a user and stores it in the database.
func CreateSession(userID int64) (string, error) {
	sessionID := uuid.New().String()
	token := uuid.New().String() // We use a second UUID for the actual token value
	expiresAt := time.Now().Add(24 * time.Hour)

	query := `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
	_, err := db.DB.Exec(query, sessionID, userID, token, expiresAt)
	if err != nil {
		return "", err
	}

	return token, nil
}

// ValidateSession checks if a token is valid and not expired.
// It returns the UserID associated with the session if valid.
func ValidateSession(token string) (int64, error) {
	var userID int64
	var expiresAt time.Time

	query := `SELECT user_id, expires_at FROM sessions WHERE token = ?`
	err := db.DB.QueryRow(query, token).Scan(&userID, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil // No session found
		}
		return 0, err
	}

	if time.Now().After(expiresAt) {
		// Optional: Clean up expired session
		_ = RevokeSession(token)
		return 0, nil
	}

	return userID, nil
}

// RevokeSession removes a session from the database (Logout).
func RevokeSession(token string) error {
	query := `DELETE FROM sessions WHERE token = ?`
	_, err := db.DB.Exec(query, token)
	return err
}
