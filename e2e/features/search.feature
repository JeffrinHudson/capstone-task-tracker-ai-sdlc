Feature: Search Tasks
  As a user
  I want to search tasks by keyword
  So that I can quickly locate relevant tasks

  Scenario: Search returns only tasks whose title matches the keyword
    Given tasks exist with titles "Fix the bug" and "Write the docs"
    When I type "bug" in the search field
    Then I should see "Fix the bug" in the list
    And I should not see "Write the docs" in the list

  Scenario: Search that matches no tasks shows the empty-state message
    Given a task exists with title "Fix the bug"
    When I type "zzznomatch" in the search field
    Then I should see the empty-state message
    And I should not see "Fix the bug" in the list
