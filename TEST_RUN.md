# Test Run

Date: 2026-06-01

## Verified

- Environment preflight: MySQL service running, Postgres containers running, ports `3000`, `5000`, and `5001` available
- `frontend`: `CI=true npm test -- --watch=false --runInBand src/pages-smoke.test.js`
- `frontend`: `npm run build`
- `frontend`: `CI=true npm test -- --watch=false --runInBand src/App.test.js`
- `frontend-employee`: `CI=true npm test -- --watch=false --runInBand src/pages-smoke.test.js`
- `frontend-employee`: `npm run build`
- `frontend-employee/backend`: `node test/run-tests.js`
- `backend`: targeted smoke assertions for registration sync helpers
- `backend`: `python -m py_compile` on updated backend modules

## Added In This Phase

- Admin guard smoke tests for valid and invalid sessions
- Attendance export route coverage
- Payroll summary/export coverage
- Payroll mark-paid and mark-pending route coverage
- Camera stream wiring, retry/reconnect, and register source switching coverage
- Route switching smoke coverage between live monitor and register pages

## Notes

- Full backend `pytest` is still not available from the system Python in this environment, so backend verification here used the project venv plus targeted checks.
