package auth

import (
	"fmt"
	"log"
	"strings"

	"github.com/ricar/daltoks/backend/internal/db"
	"golang.org/x/crypto/bcrypt"
)

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
