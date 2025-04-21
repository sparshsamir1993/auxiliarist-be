var router = require("express").Router();
router.use("/user", require("./user"));
router.use("/admin", require("./admin"));
router.use("/provider", require("./serviceProvider"));
module.exports = router;
