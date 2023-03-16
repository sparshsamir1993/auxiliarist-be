let router = require("express").Router();
router.use("/user", require("./userRoutes"));
router.use("/metrics", require("./metrics"));

module.exports = router;
