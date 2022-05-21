package auth

import (
	"fmt"
	"github.com/golang-jwt/jwt/v4"
)

type JwtParams struct {
	Secret string
	Issuer string
	Audience string
}

func ValidateJwt(tokenString string, jwtParams JwtParams) (quizId string, err error) {
	
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Validate claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if claims["aud"] != jwtParams.Audience {
				return nil, fmt.Errorf("invalid audience '%s'", claims["aud"])
			}
			if claims["iss"] != jwtParams.Issuer {
				return nil, fmt.Errorf("invalid issuer '%s'", claims["iss"])
			}
			if claims["isHost"] != true {
				return nil, fmt.Errorf("only the host can upload the quiz")
			}
			if quizId := claims["quizId"]; quizId == nil || quizId == "" {
				return nil, fmt.Errorf("quizId must be non-empty")
			}
		} else {
			return nil, fmt.Errorf("couldn't read claims")
		}

		return []byte(jwtParams.Secret), nil
	})
	if err != nil {
		return "", fmt.Errorf("failed to parse token: Error: %s", err.Error())
	}

	claims := token.Claims.(jwt.MapClaims)
	quizId = claims["quizId"].(string)
	
	return quizId, nil
}