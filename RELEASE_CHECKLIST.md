# Release Checklist (Today)

## 1) Environment

- [x] DB services running (MySQL/Postgres as required).
- [x] All required `.env` files present.
- [x] Ports available (`3000`, `5000`, `5001`).

## 2) Build/Quality

- [x] Admin frontend build passes (`frontend`).
- [x] Employee frontend build passes (`frontend-employee`).
- [x] Admin page smoke coverage passes (`frontend/src/pages-smoke.test.js`).
- [x] Backend import/compile checks pass.

## 3) Core Features

- [x] Admin login/logout and role guard works.
- [x] Employee login/logout and role guard works.
- [x] Camera stream works in Dashboard and Live Monitor.
- [x] Register camera source switching works.
- [x] New employee registration sync creates/updates the employee login with employee code and temporary password.
- [x] Admin registration shows user ID, role, department, and temporary password after sync.
- [x] Employee dashboard/profile show user ID, role, and department after login refresh.
- [x] Attendance and export works.
- [x] Payroll summary and export works.
- [x] Payroll `Mark Paid/Pending` persists.

## 4) Resilience

- [x] Invalid/expired token redirects to login.
- [x] Camera retry/reconnect behavior visible in UI.
- [x] No crash on route switching between monitor/register.

## 5) Delivery

- [x] `README.md` up to date.
- [x] `TEST_RUN.md` completed.
- [x] Known issues documented (if any).
- [x] Final commit message prepared.
