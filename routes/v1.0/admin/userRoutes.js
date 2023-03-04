let router = require("express").Router();
let User = require("../../../models/user");
const { verifyToken, jwtAuth } = require("../../../middlewares");
const { HOSPITAL_ADMIN_ROLE } = require("../../../constants/authConstants");

router.get("/", verifyToken(), async (req, res, next) => {
  const u = await jwtAuth(req, res, next);
  console.log(u);
  const users = await User.findAll({
    attributes: ["id", "email", "name", "role"],
    include: [
      {
        model: HospitalAdmin,
        as: "hospitalAdmin",
        required: false,
      },
    ],
  });
  res.status(200).send(users);
});

router.patch("/updateRole", verifyToken(), async (req, res, next) => {
  const role = req.body.role;
  const id = req.body.id;
  console.log(role, id);
  try {
    let user = await User.findOne({
      where: { id },
      include: [
        {
          model: HospitalAdmin,
          as: "hospitalAdmin",
          required: false,
        },
      ],
    });
    const currentUserRole = user.role;
    const newUserRole = req.body.role;
    const hospital = req.body.hospital;
    // console.log(currentUserRole, newUserRole);
    if (
      currentUserRole === HOSPITAL_ADMIN_ROLE &&
      newUserRole !== HOSPITAL_ADMIN_ROLE
    ) {
      await HospitalAdmin.destroy({
        where: {
          userId: id,
        },
      });
    } else if (
      (currentUserRole !== HOSPITAL_ADMIN_ROLE &&
        newUserRole === HOSPITAL_ADMIN_ROLE) ||
      (currentUserRole === HOSPITAL_ADMIN_ROLE &&
        newUserRole === HOSPITAL_ADMIN_ROLE &&
        !user.hospitalAdmin)
    ) {
      console.log(id, hospital);
      if (!hospital || !hospital.id) {
        res.status(500).send("No hospital found");
      }
      await HospitalAdmin.create({
        userId: id,
        hospitalId: hospital.id,
      });
    } else if (
      currentUserRole === HOSPITAL_ADMIN_ROLE &&
      newUserRole === HOSPITAL_ADMIN_ROLE &&
      user.hospitalAdmin &&
      user.hospitalAdmin.hospitalId !== hospital.id
    ) {
      await HospitalAdmin.update(
        { hospitalId: hospital.id },
        {
          where: {
            id: user.hospitalAdmin.id,
          },
        }
      );
    }
    // else if ((currentUserRole === newUserRole) === HOSPITAL_ADMIN_ROLE) {
    // }
    user = await user.update({ role });
    // console.log(user);
    res.status(200).send(user);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
