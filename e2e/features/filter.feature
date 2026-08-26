Feature: Filter Tasks by Status
  As a user
  I want to filter the task list by status
  So that I can focus on open work or review completed items

  Scenario: Selecting "Open" shows only open tasks
    Given an open task "Write tests" and a done task "Read README" exist
    When I select "Open" from the status filter
    Then I should see "Write tests" in the list
    And I should not see "Read README" in the list

  Scenario: Selecting "Done" shows only completed tasks
    Given an open task "Write tests" and a done task "Read README" exist
    When I select "Done" from the status filter
    Then I should see "Read README" in the list
    And I should not see "Write tests" in the list

  Scenario: Selecting "All" shows every task regardless of status
    Given an open task "Write tests" and a done task "Read README" exist
    When I select "All" from the status filter
    Then I should see both "Write tests" and "Read README" in the list
