const passport = require("passport");
const User = require("../models/user");
module.exports = async (req, res, next) => {
  let User;
  await passport.authenticate("jwt", async (err, user, info) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error occurred");
    }
    if (info !== undefined) {
      res.status(403).send(info.message);
    } else {
      User = user;
    }
  })(req, res, next);
  if (User) {
    return User;
  } else {
    return false;
  }
};
