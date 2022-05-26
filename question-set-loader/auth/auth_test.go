package auth

import (
	"testing"

	"github.com/Ryangwaite/mc-speedrun/question-set-loader/internal/testutils"
	"github.com/google/go-cmp/cmp"
)

func TestValidateJwt_valid(t *testing.T) {
	quizId := "quizid1"
	secret := "secret"
	issuer := "http://test.com"
	audience := "http://test.com"
	token, err := testutils.BuildJwt(testutils.JwtTestParams {
		Secret: secret,
		Issuer: issuer,
		Audience: audience,
		IsHost: true,
		QuizId: quizId,
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
	
	tests := map[string]testutils.JwtTestParams{
		"wrong secret": {Secret: "badsecret", Audience: audience, Issuer: issuer, IsHost: isHost, QuizId: quizId},
		"no audience": {Secret: secret, Audience: nil, Issuer: issuer, IsHost: isHost, QuizId: quizId},
		"no issuer": {Secret: secret, Audience: audience, Issuer: nil, IsHost: isHost, QuizId: quizId},
		"no isHost": {Secret: secret, Audience: audience, Issuer: issuer, IsHost: nil, QuizId: quizId},
		"no quizId": {Secret: secret, Audience: audience, Issuer: issuer, IsHost: isHost, QuizId: nil},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			token, err := testutils.BuildJwt(tc)
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
