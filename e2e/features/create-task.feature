Feature: Create Task
  As a user
  I want to create a new task
  So that I can track my work

  Scenario: Create a task with title only
    Given I am on the task list page
    When I click the "New Task" button
    And I fill in the title "Buy groceries"
    And I click "Save"
    Then I should see a task titled "Buy groceries" in the list
    And the modal should be closed

  Scenario: Create a task with all fields filled
    Given I am on the task list page
    When I click the "New Task" button
    And I fill in the title "Deploy to production"
    And I fill in the description "Final deployment steps"
    And I select priority "HIGH"
    And I fill in the due date "2026-12-31"
    And I click "Save"
    Then I should see a task titled "Deploy to production" in the list
    And the task priority should be "HIGH"
