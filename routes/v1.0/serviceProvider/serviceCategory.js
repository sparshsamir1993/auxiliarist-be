let router = require("express").Router();
const { DataTypes } = require("sequelize");
let User = require("../../../models/user")(sequelize, DataTypes);
let ServiceCategory = require("../../../models/ServiceCategory")(sequelize, DataTypes);
const { verifyToken, jwtAuth } = require("../../../middlewares");

router.post("/create", verifyToken(), async (req, res, next) => {
    const { userId, name, description } = req.body;
    console.log(userId, name, description);
    try {
        let category = await ServiceCategory.create({
            userId,
            name,
            description
        });
        res.status(200).send(category);
    } catch (err) {
        console.log(err);
        res.status(500);
    }
});

router.get("/:userId", verifyToken(), async (req, res, next) => {
    const { userId } = req.params;
    try {
        let categories = await ServiceCategory.findAll({
            where: {
                userId
            }
        });
        res.status(200).send(categories);
    } catch (err) {
        console.log(err);
    }
});

router.delete("/:catergoryId", verifyToken(), async (req, res, next) => {
    const { catergoryId } = req.params;
    try {
        let category = await ServiceCategory.destroy({
            where: {
                id: catergoryId
            }
        });
        if (category) {
            res.status(200).send("Deleted");
        } else {
            res.status(404).send("Not found");
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error deleting category");
    }
});

module.exports = router;
