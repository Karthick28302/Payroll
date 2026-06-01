const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const db = require("../src/config/db");
const AppError = require("../src/utils/appError");
const roleMiddleware = require("../src/middleware/roleMiddleware");
const app = require("../src/app");
const { signToken } = require("../src/utils/jwt");
const { loginEmployeeService } = require("../src/modules/auth/auth.service");
const {
  getMyProfileService,
  updateMyProfileService,
} = require("../src/modules/employee/employee.service");

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("login validation rejects missing credentials", async () => {
  await assert.rejects(
    loginEmployeeService({ identifier: "", password: "" }),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test("login succeeds for active employee", async () => {
  const originalQuery = db.query;
  const passwordHash = await bcrypt.hash("Emp@12345", 10);
  db.query = async () => ({
    rows: [
      {
        id: 1,
        employee_code: "EMP1001",
        full_name: "Demo Employee",
        email: "employee@example.com",
        password_hash: passwordHash,
        role: "employee",
        status: "active",
        department: "IT",
        designation: "Developer",
        join_date: "2026-01-01",
        phone: "9876543210",
        address: "Chennai",
      },
    ],
  });

  try {
    const result = await loginEmployeeService({
      identifier: "EMP1001",
      password: "Emp@12345",
    });
    assert.ok(result.token);
    assert.equal(result.employee.employeeCode, "EMP1001");
    assert.equal(result.employee.department, "IT");
    assert.equal(result.employee.designation, "Developer");
  } finally {
    db.query = originalQuery;
  }
});

test("role middleware blocks wrong role", async () => {
  const req = { user: { role: "admin" } };
  const res = {};
  let captured = null;
  roleMiddleware("employee")(req, res, (error) => {
    captured = error;
  });
  assert.ok(captured instanceof AppError);
  assert.equal(captured.statusCode, 403);
});

test("profile fetch returns normalized object", async () => {
  const originalQuery = db.query;
  db.query = async () => ({
    rows: [
      {
        id: 1,
        employee_code: "EMP1001",
        full_name: "Demo Employee",
        email: "employee@example.com",
        role: "employee",
        department: "IT",
        designation: "Developer",
        join_date: "2026-01-01",
        phone: "9876543210",
        address: "Chennai",
      },
    ],
  });

  try {
    const result = await getMyProfileService(1);
    assert.equal(result.fullName, "Demo Employee");
    assert.equal(result.department, "IT");
  } finally {
    db.query = originalQuery;
  }
});

test("auth me returns full employee profile", async () => {
  const originalQuery = db.query;
  const { baseUrl, stop } = await startTestServer();
  const employeeToken = signToken({
    sub: 1,
    role: "employee",
    email: "employee@example.com",
    employeeCode: "EMP1001",
  });

  db.query = async (text) => {
    if (text.includes("FROM users u")) {
      return {
        rows: [
          {
            id: 1,
            employee_code: "EMP1001",
            full_name: "Demo Employee",
            email: "employee@example.com",
            role: "employee",
            department: "IT",
            designation: "Developer",
            join_date: "2026-01-01",
            phone: "9876543210",
            address: "Chennai",
          },
        ],
      };
    }

    return { rows: [] };
  };

  try {
    const response = await callJson("GET", `${baseUrl}/api/v1/auth/me`, employeeToken);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.department, "IT");
    assert.equal(response.body.data.user.id, 1);
  } finally {
    db.query = originalQuery;
    await stop();
  }
});

test("profile update validates full name", async () => {
  await assert.rejects(
    updateMyProfileService(1, { fullName: " ", phone: "", address: "" }),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test("profile update writes user and profile", async () => {
  const originalQuery = db.query;
  const calls = [];
  db.query = async (text, params = []) => {
    calls.push(text);
    if (text.includes("UPDATE employee_profiles")) return { rowCount: 1, rows: [] };
    if (text.includes("SELECT")) {
      return {
        rows: [
          {
            id: 1,
            employee_code: "EMP1001",
            full_name: "Updated Name",
            email: "employee@example.com",
            role: "employee",
            department: "IT",
            designation: "Developer",
            join_date: "2026-01-01",
            phone: "9999999999",
            address: "Updated Address",
          },
        ],
      };
    }
    return { rowCount: 1, rows: [] };
  };

  try {
    const result = await updateMyProfileService(1, {
      fullName: "Updated Name",
      phone: "9999999999",
      address: "Updated Address",
    });
    assert.equal(result.fullName, "Updated Name");
    assert.ok(calls.some((x) => x.includes("UPDATE users")));
    assert.ok(calls.some((x) => x.includes("UPDATE employee_profiles")));
  } finally {
    db.query = originalQuery;
  }
});

const startTestServer = async () => {
  const server = app.listen(0);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const stop = async () => new Promise((resolve) => server.close(resolve));

  return { baseUrl, stop };
};

const callJson = async (method, url, token) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { method, headers });
  const body = await response.json();
  return { status: response.status, body };
};

test("GET /api/v1/me/profile returns 401 without token", async () => {
  const { baseUrl, stop } = await startTestServer();

  try {
    const response = await callJson("GET", `${baseUrl}/api/v1/me/profile`);
    assert.equal(response.status, 401);
    assert.equal(response.body.status, "error");
  } finally {
    await stop();
  }
});

test("GET /api/v1/me/profile returns 401 with invalid token", async () => {
  const { baseUrl, stop } = await startTestServer();

  try {
    const response = await callJson("GET", `${baseUrl}/api/v1/me/profile`, "invalid.token.value");
    assert.equal(response.status, 401);
    assert.equal(response.body.status, "error");
  } finally {
    await stop();
  }
});

test("GET /api/v1/me/profile returns 403 for non-employee role", async () => {
  const { baseUrl, stop } = await startTestServer();
  const adminToken = signToken({
    sub: 1,
    role: "admin",
    email: "admin@example.com",
    employeeCode: "ADM001",
  });

  try {
    const response = await callJson("GET", `${baseUrl}/api/v1/me/profile`, adminToken);
    assert.equal(response.status, 403);
    assert.equal(response.body.status, "error");
  } finally {
    await stop();
  }
});

test("GET /api/v1/me/* returns 200 for valid employee token", async () => {
  const originalQuery = db.query;
  const { baseUrl, stop } = await startTestServer();
  const employeeToken = signToken({
    sub: 1,
    role: "employee",
    email: "employee@example.com",
    employeeCode: "EMP1001",
  });

  db.query = async (text) => {
    if (text.includes("FROM users u")) {
      return {
        rows: [
          {
            id: 1,
            employee_code: "EMP1001",
            full_name: "Demo Employee",
            email: "employee@example.com",
            role: "employee",
            department: "IT",
            designation: "Developer",
            join_date: "2026-01-01",
            phone: "9876543210",
            address: "Chennai",
          },
        ],
      };
    }

    if (text.includes("FROM attendance")) {
      return {
        rows: [
          {
            id: 1,
            work_date: "2026-05-01",
            login_time: "2026-05-01T09:00:00.000Z",
            logout_time: "2026-05-01T18:00:00.000Z",
            total_hours: "9.00",
            status: "present",
          },
        ],
      };
    }

    if (text.includes("FROM salaries")) {
      return {
        rows: [
          {
            id: 1,
            month: 5,
            year: 2026,
            basic_salary: "35000",
            allowances: "5000",
            deductions: "1500",
            net_salary: "38500",
            paid_on: "2026-05-31",
          },
        ],
      };
    }

    if (text.includes("FROM events")) {
      return {
        rows: [
          {
            id: 1,
            title: "Townhall",
            description: "Monthly townhall",
            event_date: "2026-05-20",
            event_time: "10:00:00",
            location: "Main Hall",
          },
        ],
      };
    }

    if (text.includes("FROM holidays")) {
      return {
        rows: [
          {
            id: 1,
            holiday_name: "Labour Day",
            holiday_date: "2026-05-01",
            holiday_type: "public",
          },
        ],
      };
    }

    return { rows: [] };
  };

  try {
    const endpoints = ["profile", "attendance", "salary", "events", "holidays"];
    for (const endpoint of endpoints) {
      const response = await callJson("GET", `${baseUrl}/api/v1/me/${endpoint}`, employeeToken);
      assert.equal(response.status, 200);
      assert.equal(response.body.status, "success");
    }
  } finally {
    db.query = originalQuery;
    await stop();
  }
});

const run = async () => {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`PASS: ${t.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL: ${t.name}`);
      console.error(error);
    }
  }

  console.log(`\nTotal: ${tests.length}, Passed: ${tests.length - failed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
};

run();
