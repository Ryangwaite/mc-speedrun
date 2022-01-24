package auth

import (
	"fmt"
	"github.com/golang-jwt/jwt/v4"
)

// TODO: Receive all of the following from config/env vars
const jwtSecret = "dockercomposesecret"
const jwtIssuer = "http://sign-on/"
const jwtAudience = "http://0.0.0.0/"

func ValidateJwt(tokenString string) (quizId string, err error) {
	
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Validate claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if claims["aud"] != jwtAudience {
				return nil, fmt.Errorf("invalid audience '%s'", claims["aud"])
			}
			if claims["iss"] != jwtIssuer {
				return nil, fmt.Errorf("invalid issuer '%s'", claims["iss"])
			}
			if claims["isHost"] != true {
				return nil, fmt.Errorf("only the host can upload the quiz")
			}
			if claims["quizId"] == "" {
				return nil, fmt.Errorf("quizId must be non-empty")
			}
		} else {
			return nil, fmt.Errorf("couldn't read claims")
		}

		return []byte(jwtSecret), nil
	})
	if err != nil {
		return "", fmt.Errorf("failed to parse token: Error: %s", err.Error())
	}

	claims := token.Claims.(jwt.MapClaims)
	quizId = claims["quizId"].(string)
	
	return quizId, nil
}