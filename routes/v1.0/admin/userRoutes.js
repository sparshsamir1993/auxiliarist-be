let router = require("express").Router();
const { DataTypes } = require("sequelize");
let User = require("../../../models/user")(sequelize, DataTypes);
const { verifyToken, jwtAuth } = require("../../../middlewares");

router.get("/", verifyToken(), async (req, res, next) => {
  const u = await jwtAuth(req, res, next);
  const users = await User.findAll({
    attributes: ["id", "email", "firstName", "lastName", "role"]
  });
  res.status(200).send(users);
});

router.patch("/updateRole", verifyToken(), async (req, res, next) => {
  const role = req.body.role;
  const id = req.body.id;
  try {
    let user = await User.findOne({
      where: { id }
    });
    user = await user.update({ role });
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
