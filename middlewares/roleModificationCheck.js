module.exports = () => {
  return async (req, res, next) => {
    let user = await jwtAuth(req, res, next);
    let { role } = user;
    let roleFromRequest = req.body.role;
    if (role != "ADMIN" && roleFromRequest) {
      res.status(500).send("Not allowed to modify role");
    }
  };
};
