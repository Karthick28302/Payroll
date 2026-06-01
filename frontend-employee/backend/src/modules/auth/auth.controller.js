const asyncHandler = require("../../utils/asyncHandler");
const { getMyProfileService } = require("../employee/employee.service");
const { loginEmployeeService } = require("./auth.service");

const loginEmployee = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const data = await loginEmployeeService({ identifier, password });
  res.status(200).json({ status: "success", data });
});

const getCurrentEmployee = asyncHandler(async (req, res) => {
  const profile = await getMyProfileService(req.user.id);
  res.status(200).json({
    status: "success",
    data: {
      user: profile,
    },
  });
});

module.exports = {
  loginEmployee,
  getCurrentEmployee,
};
