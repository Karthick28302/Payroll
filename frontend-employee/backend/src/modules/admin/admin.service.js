const bcrypt = require("bcryptjs");
const db = require("../../config/db");

const EMPLOYEE_CODE_REGEX = /^EMP[0-9]{4,}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const upsertEmployeeFromAdmin = async (payload) => {
  const employeeCode = String(payload.employeeCode || "").trim().toUpperCase();
  const fullName = String(payload.fullName || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "").trim();
  const department = payload.department ? String(payload.department).trim() : null;
  const designation = payload.designation ? String(payload.designation).trim() : null;
  const phone = payload.phone ? String(payload.phone).trim() : null;
  const address = payload.address ? String(payload.address).trim() : null;

  if (!employeeCode || !fullName || !email || !password) {
    return { ok: false, message: "employeeCode, fullName, email and password are required." };
  }
  if (!EMPLOYEE_CODE_REGEX.test(employeeCode)) {
    return { ok: false, message: "employeeCode must match format EMP#### (for example EMP1001)." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: "email format is invalid." };
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      message: "password must be at least 8 chars and include uppercase, lowercase, number, and special character.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db.query(
    `
      SELECT id
      FROM users
      WHERE employee_code = $1 OR email = $2
      LIMIT 1
    `,
    [employeeCode, email]
  );

  let user;
  if (existing.rowCount > 0) {
    const updated = await db.query(
      `
        UPDATE users
        SET
          employee_code = $1,
          full_name = $2,
          email = $3,
          password_hash = $4,
          role = 'employee',
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, employee_code, full_name, email
      `,
      [employeeCode, fullName, email, passwordHash, existing.rows[0].id]
    );
    user = updated.rows[0];
  } else {
    const inserted = await db.query(
      `
        INSERT INTO users (employee_code, full_name, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, 'employee', 'active')
        RETURNING id, employee_code, full_name, email
      `,
      [employeeCode, fullName, email, passwordHash]
    );
    user = inserted.rows[0];
  }

  const updatedProfile = await db.query(
    `
      UPDATE employee_profiles
      SET
        department = $1,
        designation = $2,
        phone = $3,
        address = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
    `,
    [department, designation, phone, address, user.id]
  );

  if (updatedProfile.rowCount === 0) {
    await db.query(
      `
        INSERT INTO employee_profiles (user_id, department, designation, phone, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [user.id, department, designation, phone, address]
    );
  }

  return { ok: true, user };
};

module.exports = {
  upsertEmployeeFromAdmin,
};
