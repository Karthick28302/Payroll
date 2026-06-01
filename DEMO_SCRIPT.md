# Demo Script

Use this flow for the final project submission demo.

## 1) Opening

- Show the root `README.md` and explain the two-app architecture.
- Mention the admin stack on ports `3000` and `5000`.
- Mention the employee stack on ports `3001` and `5001`.

## 2) Admin Login

- Open the admin login page.
- Sign in with the admin account.
- Show that invalid credentials are rejected and the session is protected.

## 3) Live Monitoring

- Open the dashboard.
- Point out the live camera feed panel.
- Show retry/reconnect behavior if the camera is unavailable.
- Show attendance summary and recent activity.

## 4) Register New Employee

- Open the register employee page.
- Capture a face image.
- Fill in name, employee code, email, department, designation, and optional password.
- Submit the form.
- Show the success card with:
  - User ID
  - Employee Code
  - Email
  - Role
  - Department
  - Temporary Password
- Copy the details to clipboard.

## 5) Reports

- Open the attendance records page.
- Apply a date filter.
- Export attendance to Excel.
- Open the reports page.
- Show attendance analytics, payroll summary, and payroll status actions.
- Mark one row as paid, then back to pending.

## 6) Settings

- Open settings.
- Show the admin-only danger zone actions.
- Explain the face encoding clear and attendance reset options.

## 7) Employee Portal

- Open the employee login page.
- Sign in using the synced employee credentials.
- Show the employee dashboard snapshot.
- Open profile and point out the user ID, department, designation, and editable profile fields.
- Open attendance, salary, events, and holidays pages.

## 8) Closing

- Show the release checklist and test run log.
- Mention that the repository now has build checks, smoke tests, Docker setup, and release notes.

## Screenshot Checklist

Capture these if you want a polished submission bundle:

- Admin login page
- Admin dashboard with live camera feed
- Register employee success card
- Attendance export / reports page
- Employee dashboard
- Employee profile page
- Release checklist page or file view
