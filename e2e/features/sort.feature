Feature: Sort Tasks by Due Date
  As a user
  I want to sort the task list by due date ascending or descending
  So that I can see what is due soonest or review the furthest deadlines first
  And tasks without a due date always appear last

  Scenario: Ascending sort places the earliest due date first
    Given tasks "Early Task" (due 2026-09-01) and "Late Task" (due 2026-12-31) exist
    When I select "Asc" from the sort dropdown
    Then "Early Task" should appear before "Late Task"

  Scenario: Descending sort places the latest due date first
    Given tasks "Early Task" (due 2026-09-01) and "Late Task" (due 2026-12-31) exist
    When I select "Desc" from the sort dropdown
    Then "Late Task" should appear before "Early Task"

  Scenario: Tasks without a due date always appear last in ascending sort
    Given task "Has Due Date" (due 2026-09-01) and task "No Due Date" (no due date) exist
    When I select "Asc" from the sort dropdown
    Then "Has Due Date" should appear before "No Due Date"
