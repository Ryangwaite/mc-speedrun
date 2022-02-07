#!/bin/bash

set -e

QUIZ_ID="sampledata1"
DESTINATION="/tmp/question-sets/${QUIZ_ID}.json"

mkdir -p $(dirname $DESTINATION)
cp ../sample-quizzes/example-2.json "$DESTINATION"