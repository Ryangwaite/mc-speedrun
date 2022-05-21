package auth

import (
	"testing"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/go-cmp/cmp"
)

type jwtTestParams struct {
	secret string
	audience interface{}
	issuer interface{}
	isHost interface{}
	quizId interface{}
}

// Builds a jwt token from the provide parameters. Set the interface
func buildJwt(jwtParams jwtTestParams) (string, error) {
	claims := make(jwt.MapClaims)
	if jwtParams.audience != nil {
		claims["aud"] = jwtParams.audience
	}
	if jwtParams.issuer != nil {
		claims["iss"] = jwtParams.issuer
	}
	if jwtParams.isHost != nil {
		claims["isHost"] = jwtParams.isHost
	}
	if jwtParams.quizId != nil {
		claims["quizId"] = jwtParams.quizId
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtParams.secret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func TestValidateJwt_valid(t *testing.T) {
	quizId := "quizid1"
	secret := "secret"
	issuer := "http://test.com"
	audience := "http://test.com"
	token, err := buildJwt(jwtTestParams {
		secret,
		issuer,
		audience,
		true,
		quizId,
	})
	if err != nil {
		t.Errorf("Failed creating test jwt with: %v", err)
	}

	t.Logf("Token is: %s", token)

	parsedQuizId, err := ValidateJwt(token, JwtParams{
		secret,
		issuer,
		audience,
	})
	if err != nil {
		t.Errorf("Returned error response '%v'. Expected nil", err)
	}
	if diff := cmp.Diff(quizId, parsedQuizId); diff != "" {
		t.Errorf("Wrong parsed quizid '%s', expected '%s'", parsedQuizId, quizId)
	}
}

func TestValidateJwt_invalid(t *testing.T) {

	// constants
	const audience = "http://test.com"
	const issuer = "http://test.com"
	const isHost = true
	const quizId = "quizid1"
	const secret = "secret"
	
	tests := map[string]jwtTestParams{
		"wrong secret": {secret: "badsecret", audience: audience, issuer: issuer, isHost: isHost, quizId: quizId},
		"no audience": {secret: secret, audience: nil, issuer: issuer, isHost: isHost, quizId: quizId},
		"no issuer": {secret: secret, audience: audience, issuer: nil, isHost: isHost, quizId: quizId},
		"no isHost": {secret: secret, audience: audience, issuer: issuer, isHost: nil, quizId: quizId},
		"no quizId": {secret: secret, audience: audience, issuer: issuer, isHost: isHost, quizId: nil},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			token, err := buildJwt(tc)
			if err != nil {
				t.Fatalf("Failed to build token for test")
			}
			_, err = ValidateJwt(token, JwtParams{Secret: secret, Issuer: issuer, Audience: audience})
			if err == nil {
				t.Errorf("Failed to detect error")
			}
		})
	}
}
