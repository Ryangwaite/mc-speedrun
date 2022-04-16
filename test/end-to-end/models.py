from dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import List

@dataclass_json
@dataclass
class Question:
    question: str
    category: str
    options: List[str]
    answers: List[int]