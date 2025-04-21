let router = require("express").Router();
router.use("/categories", require("./serviceCategory"));
module.exports = router;