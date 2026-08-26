Feature: Task Form Validation
  As a user
  I want to see clear error messages when I submit invalid data
  So that I understand what needs to be corrected

  Scenario: Submit the form without a title shows a required-field error
    Given I am on the task list page
    When I click the "New Task" button
    And I click "Save" without entering a title
    Then I should see the error "Title is required"
    And the modal should remain open

  Scenario: Typing a title after the error clears the error and saves
    Given I am on the task list page
    And I have triggered the title-required validation error
    When I type "My task" into the title field
    And I click "Save"
    Then the task "My task" should appear in the list
    And the modal should be closed
