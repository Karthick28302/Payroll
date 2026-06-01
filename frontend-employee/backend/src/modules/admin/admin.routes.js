const router = require("express").Router();
const { syncEmployee } = require("./admin.controller");

router.post("/sync-employee", syncEmployee);

module.exports = router;
