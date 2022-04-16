from typing import List
from models import Question
from playwright.sync_api._generated import Browser, Page
from playwright.sync_api import expect

def _add_participant(browser: Browser, username: str, access_code: str) -> Page:
    """ Starts a new browser session, opens a new page and joins
        a new participant with the provided username.
    """
    # Open new page
    participant_context = browser.new_context()
    participant_page = participant_context.new_page()

    # Go to http://localhost/
    participant_page.goto("http://localhost/")

    # Insert access code
    participant_page.locator("input[type=\"text\"]").fill(access_code)

    # Click "enter"
    with participant_page.expect_navigation(url="http://localhost/lobby"):
        participant_page.locator("text=Enter").click()

    # Insert username
    participant_page.locator("input[type=\"text\"]").fill(username)

    # Join the quiz
    participant_page.locator("text=Join").click()

    return participant_page


def _answer_question_correctly(question: Question, participant_page: Page):
    """ Given the question data and the participant page corresponding to the question,
        selects all the correct options and submits it.
    """
    # Click the correct options
    for option_index in question.answers:
        option_text = question.options[option_index]
        option_letter = ["A", "B", "C", "D"][option_index]
        participant_page.locator(f"text=/{option_letter}\\)\\s+{option_text}/i").click()

    # Submit selection
    participant_page.locator("text=Submit").click()


def test_happy_path_15_participants(browser: Browser, quiz_question_filepath: str, quiz_questions: List[Question]):
    
    host_context = browser.new_context()

    #### Start Host Config ####

    # Start host page and configure anything
    host_page: Page = host_context.new_page()
    host_page.goto("http://localhost/")

    with host_page.expect_navigation(url="http://localhost/config"):
        # Click begin button which should redirect to /config page
        host_page.locator("text=Begin").click()

    # Input quiz name
    host_page.locator("text=NameName >> input[type=\"text\"]").fill("quiz name")  # TODO: Fix up this locator - its a bit weird

    # Click Upload Quiz button to bring up the modal
    host_page.locator("text=Upload Quiz").click()

    with host_page.expect_file_chooser() as fc_info:
        # Click choose button to launch file explorer dialog...
        host_page.locator("text=Choose").click()
    # ... and populate it with "example-1.json"
    file_chooser = fc_info.value
    file_chooser.set_files(quiz_question_filepath)

    # Upload the selected quiz
    host_page.locator("button:has-text(\"Upload\")").click()

    # Unselect the animals category
    host_page.locator("text=animals").click()

    # Set the question answer duration to 5 seconds
    host_page.locator("input[type=\"number\"]").fill("5")

    # NOTE: Copy and paste is not currently supported so read
    # the text instead. See https://github.com/microsoft/playwright/issues/8114

    # Read the access code from the page
    access_code = host_page.locator("text=Access CodeAccess Code >> input[type=\"text\"]").input_value()

    #### Stop Host Config ####
    #### Start add participants ####
    participant_pages = []
    for i in range(15):
        participant_pages += [_add_participant(browser, f"user{i}", access_code)]
    
    #### Stop add participants ####
    #### Start Quiz ####
    with host_page.expect_navigation(url="http://localhost/summary"):
            host_page.locator("text=Start").click()
    #### Stop Quiz ####
    #### Start Answer questions ####

    # Filter out the questions that weren't in a selected category
    filtered_questions = filter(lambda q: q.category != "animals", quiz_questions)

    for question in filtered_questions:
        for participant_page in participant_pages:
            _answer_question_correctly(question, participant_page)

    #### Stop Answer questions ####
    #### Start Assert final result ####
    
    expect(host_page).to_have_url("http://localhost/summary")
    for participant_page in participant_pages:
        expect(participant_page).to_have_url("http://localhost/summary")

    # Host return to home
    host_page.locator("text=RETURN TO HOME").click()
    expect(host_page).to_have_url("http://localhost/")

    # Participants return to home
    for participant_page in participant_pages:
        participant_page.locator("text=RETURN TO HOME").click()
        expect(participant_page).to_have_url("http://localhost/")

    #### Stop Assert final result ####
