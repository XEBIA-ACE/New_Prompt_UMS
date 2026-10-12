# Tasks: US-001

- [ ] T001 FR-001: Given the user has MFA enabled and entered the correct password, the system must send a one-time code to the user's email without creating a session.
- [ ] T002 FR-002: Given the user enters the wrong one-time code or a code that has expired, the system must refuse the login and ensure no session is created.
- [ ] T003 Verify US-001-ac-1: Given the user has MFA enabled and entered the correct password, when the login attempt is made, then a one-time code is sent to the user's email without creating a session.
- [ ] T004 Verify US-001-ac-2: Given the user enters the wrong or expired one-time code, when attempting to verify, then the login is refused and no session is created.
- [ ] T005 Verify IMPACT: Verify acceptance criterion: Given the user has MFA enabled and entered the correct password, when the login attempt is made, then a one-time code is sent to the user's email without creating a session.
- [ ] T006 Verify IMPACT: Verify acceptance criterion: Given the user enters the wrong or expired one-time code, when attempting to verify, then the login is refused and no session is created.