# SmartAttend - Final Runbook

This repo contains two apps:

- `frontend` + `backend`: Admin panel for camera monitor, attendance, reports, payroll, and user registration.
- `frontend-employee` + `frontend-employee/backend`: Employee portal for profile, attendance, salary, events, and holidays.

## 1) Environment Files

Copy the example files before starting:

- [`.env.example`](/C:/Users/Karthick%20C/OneDrive/Desktop/Project/.env.example) for the admin backend.
- [`frontend/.env.example`](/C:/Users/Karthick%20C/OneDrive/Desktop/Project/frontend/.env.example) for the admin frontend.
- [`frontend-employee/.env.example`](/C:/Users/Karthick%20C/OneDrive/Desktop/Project/frontend-employee/.env.example) for the employee frontend.
- [`frontend-employee/backend/.env.example`](/C:/Users/Karthick%20C/OneDrive/Desktop/Project/frontend-employee/backend/.env.example) for the employee backend.

## 2) Start Order

1. Start MySQL for the admin backend.
2. Start PostgreSQL for the employee backend.
3. Start the admin backend.
4. Start the employee backend.
5. Start the admin frontend.
6. Start the employee frontend.

## 3) Admin App

### Backend
```powershell
cd "C:\Users\Karthick C\OneDrive\Desktop\Project"
python -m backend.main
```

Default backend port:
- `5000`

### Frontend
```powershell
cd "C:\Users\Karthick C\OneDrive\Desktop\Project\frontend"
npm.cmd start
```

Default frontend port:
- `3000`

### Admin login
- Username: `admin`
- Password: `admin123`

## 4) Employee App

### Backend
```powershell
cd "C:\Users\Karthick C\OneDrive\Desktop\Project\frontend-employee\backend"
npm.cmd run dev
```

Default backend port:
- `5001`

### Frontend
```powershell
cd "C:\Users\Karthick C\OneDrive\Desktop\Project\frontend-employee"
npm.cmd start
```

Default frontend port:
- `3001` when you want it separate from the admin UI.

### Employee login
- Identifier: `EMP1001`
- Password: `Emp@12345`

## 5) Key APIs Implemented

### Admin
- `POST /api/login`
- `GET /attendance`
- `GET /attendance/stats`
- `GET /video_feed`
- `GET /camera/status`
- `POST /camera/release`
- `GET /camera/sources`
- `POST /camera/sources`
- `PUT /camera/sources/<id>`
- `POST /camera/sources/<id>/activate`
- `DELETE /camera/sources/<id>`
- `POST /camera/sources/test`
- `GET /camera/health-logs`
- `GET /camera/recordings`
- `POST /camera/recording/start`
- `POST /camera/recording/stop`
- `GET /payroll/summary`
- `GET /payroll/export`
- `POST /payroll/mark-paid`
- `POST /payroll/mark-pending`

### Employee
- `POST /api/v1/auth/login`
- `GET /api/v1/me/profile`
- `GET /api/v1/me/attendance`
- `GET /api/v1/me/salary`
- `GET /api/v1/me/events`
- `GET /api/v1/me/holidays`

## 6) Common Errors

- `EADDRINUSE`: port already in use. Stop previous process and restart.
- `npm ENOENT package.json`: run command from correct app folder, not repo root.
- `ECONNREFUSED pg-pool`: employee backend cannot reach Postgres; check `DATABASE_URL`.
- Camera unavailable on Register: switch source and retry; backend release is built in.

## 7) Validation Docs

- Full smoke checklist: [TEST_RUN.md](C:\Users\Karthick C\OneDrive\Desktop\Project\TEST_RUN.md)
- Release checklist: [RELEASE_CHECKLIST.md](C:\Users\Karthick C\OneDrive\Desktop\Project\RELEASE_CHECKLIST.md)
- Demo script: [DEMO_SCRIPT.md](C:\Users\Karthick C\OneDrive\Desktop\Project\DEMO_SCRIPT.md)

## 8) Docker Compose

To start the full stack locally:

```powershell
cd "C:\Users\Karthick C\OneDrive\Desktop\Project"
docker compose up --build
```

Services exposed by default:

- Admin frontend: `http://localhost:3000`
- Admin backend: `http://localhost:5000`
- Employee frontend: `http://localhost:3001`
- Employee backend: `http://localhost:5001`
- MySQL: `localhost:3306`
- PostgreSQL: `localhost:5432`
