const bcrypt = require("bcryptjs");
const db = require("../../config/db");
const AppError = require("../../utils/appError");
const { signToken } = require("../../utils/jwt");

const findEmployeeByIdentifier = async (identifier) => {
  const query = `
    SELECT
      u.id,
      u.employee_code,
      u.full_name,
      u.email,
      u.password_hash,
      u.role,
      u.status,
      ep.department,
      ep.designation,
      ep.join_date,
      ep.phone,
      ep.address
    FROM users u
    LEFT JOIN employee_profiles ep ON ep.user_id = u.id
    WHERE u.employee_code = $1 OR u.email = $1
    LIMIT 1
  `;

  const { rows } = await db.query(query, [identifier]);
  return rows[0] || null;
};

const loginEmployeeService = async ({ identifier, password }) => {
  if (!identifier || !password) {
    throw new AppError("Identifier and password are required.", 400);
  }

  const employee = await findEmployeeByIdentifier(identifier);

  if (!employee) {
    throw new AppError("Invalid credentials.", 401);
  }

  if (employee.status !== "active") {
    throw new AppError("Account is inactive. Contact admin.", 403);
  }

  if (employee.role !== "employee") {
    throw new AppError("Only employee login is allowed here.", 403);
  }

  const isMatch = await bcrypt.compare(password, employee.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid credentials.", 401);
  }

  const token = signToken({
    sub: employee.id,
    role: employee.role,
    email: employee.email,
    employeeCode: employee.employee_code,
  });

  return {
    token,
    employee: {
      id: employee.id,
      employeeCode: employee.employee_code,
      fullName: employee.full_name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      department: employee.department,
      designation: employee.designation,
      joinDate: employee.join_date,
      phone: employee.phone,
      address: employee.address,
    },
  };
};

module.exports = {
  loginEmployeeService,
};
