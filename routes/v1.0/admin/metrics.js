const verifyToken = require("../../../middlewares/verifyToken");

var router = require("express").Router();
const { DataTypes } = require("sequelize");
const Users = require("../../../models/user")(sequelize, DataTypes);
router.get("/users", verifyToken(), async (req, res, next) => {
    try {
        let users = await Users.findAll({
            attributes: ["firstName", "lastName", "email", "role", "createdAt"]
        });
        res.status(200).send(users);
    } catch (err) {
        res.sendStatus(404);
        console.log(err);
    }
});

module.exports = router;
