const asyncHandler = require("../../utils/asyncHandler");
const env = require("../../config/env");
const { upsertEmployeeFromAdmin } = require("./admin.service");

const syncEmployee = asyncHandler(async (req, res) => {
  const syncKey = req.headers["x-sync-key"];
  if (!syncKey || syncKey !== env.ADMIN_SYNC_KEY) {
    return res.status(401).json({ status: "error", message: "Unauthorized sync request." });
  }

  const result = await upsertEmployeeFromAdmin(req.body || {});
  if (!result.ok) {
    return res.status(400).json({ status: "error", message: result.message });
  }

  return res.status(200).json({
    status: "success",
    message: "Employee account synced successfully.",
    data: {
      user: result.user,
    },
  });
});

module.exports = {
  syncEmployee,
};
