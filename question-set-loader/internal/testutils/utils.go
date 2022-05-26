package testutils

import "github.com/golang-jwt/jwt/v4"

type JwtTestParams struct {
	Secret string
	Audience interface{}
	Issuer interface{}
	IsHost interface{}
	QuizId interface{}
}

// Builds a jwt token from the provide parameters. Set the interface
func BuildJwt(jwtParams JwtTestParams) (string, error) {
	claims := make(jwt.MapClaims)
	if jwtParams.Audience != nil {
		claims["aud"] = jwtParams.Audience
	}
	if jwtParams.Issuer != nil {
		claims["iss"] = jwtParams.Issuer
	}
	if jwtParams.IsHost != nil {
		claims["isHost"] = jwtParams.IsHost
	}
	if jwtParams.QuizId != nil {
		claims["quizId"] = jwtParams.QuizId
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtParams.Secret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}
