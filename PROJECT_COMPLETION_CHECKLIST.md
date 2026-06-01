# Project Completion Checklist

Use this checklist to complete the Smart Attendance System end-to-end.

## 1) Scope Freeze

- [ ] Finalize exact deliverables for admin module.
- [ ] Finalize exact deliverables for employee module.
- [ ] Freeze "must-have" vs "nice-to-have" features.

## 2) Employee Module (Non-Admin)

- [x] Login with employee credentials.
- [x] Dashboard route flow.
- [x] Profile view from API.
- [x] Attendance list from API.
- [x] Salary list from API.
- [x] Events list from API.
- [x] Holidays list from API.
- [x] Attendance month/year filters.
- [x] Salary month/year filters.
- [x] Profile edit (API + UI).
- [ ] Employee route/frontend tests.

## 3) Admin Module

- [ ] Admin login flow stable.
- [ ] User registration with face capture.
- [ ] User list/detail pages.
- [ ] Compensation update flow.
- [ ] Delete user flow with encoding cleanup.
- [ ] Attendance report view with date filters.
- [ ] Export report (Excel) validation.

## 4) Security and Access Control

- [ ] Protect all employee APIs with JWT.
- [ ] Protect all admin APIs with role checks.
- [ ] Verify employee cannot access admin APIs.
- [ ] Verify invalid/expired token behavior across frontend.

## 5) Database and Data

- [ ] Confirm schema consistency for both modules.
- [ ] Add/verify foreign keys and required indexes.
- [ ] Seed demo data for admin + employees.
- [ ] Add one-command DB setup instructions.

## 6) Testing and QA

- [ ] Backend smoke tests passing.
- [ ] Core API tests for auth, attendance, salary, profile.
- [ ] Frontend smoke flow tests for admin and employee.
- [ ] Manual test checklist completed (camera + face recognition).

## 7) Deployment Readiness

- [ ] Update all `.env.example` files.
- [ ] Confirm CORS and port configuration in local/dev.
- [ ] Docker Compose runbook verified.
- [ ] Production frontend build verified.

## 8) Documentation and Demo

- [ ] Root README updated with architecture and setup.
- [ ] API endpoint list updated (admin + employee).
- [ ] Troubleshooting section added.
- [ ] Demo script with screenshots prepared.

## Immediate Next Steps

1. Implement employee profile edit API and UI.
2. Add role-based checks for admin endpoints (if missing).
3. Run full test pass and close remaining checklist items.
