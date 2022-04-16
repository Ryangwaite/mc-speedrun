import pytest
import json
from models import Question

@pytest.fixture
def quiz_question_filepath():
    return "../../sample-quizzes/example-1.json"

@pytest.fixture
def quiz_questions(quiz_question_filepath: str):
    """ Load the file in as a dict from disc
    """
    with open(quiz_question_filepath, "r") as f:
        return map(lambda q: Question.from_dict(q), json.load(f))
