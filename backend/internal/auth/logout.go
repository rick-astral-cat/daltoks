package auth

import (
	"net/http"
	"time"
)

// LogoutHandler clears the session cookie and revokes the session in the database.
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err == nil {
		// Revoke session in database
		_ = RevokeSession(cookie.Value)
	}

	// Clear the cookie in the browser by setting its expiration to the past
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   false, // Set to true in production
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Logged out successfully"}`))
}
