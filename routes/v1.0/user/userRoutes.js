var router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { DataTypes } = require("sequelize");
const User = require("../../../models/user")(sequelize, DataTypes);
const jwtSecret = require("../../../config/jwtConfig");
const { v4: uuid } = require("uuid");
const redisClient = require("../../../services/redis-client");
const { validate } = require("../../../middlewares");
const { redis } = require("../../../middlewares")
const { body, validationResult, check, header } = require("express-validator");
const CONSTANTS = require("../../../constants");
const { verifyToken, jwtAuth } = require("../../../middlewares");
const bcrypt = require("bcrypt");
const BCRYPT_SALT_ROUNDS = 12;
const {
  REFRESH_EXPIRY,
  JWT_EXPIRY,
  FE_ADDRESS,
} = require("../../../constants/authConstants");
const errHandler = (err) => {
  console.log("Error :: " + err);
};

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["public_profile", "email"]
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const user = req.user;
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret.secret,
      {
        expiresIn: REFRESH_EXPIRY,
      }
    );
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret.secret,
      {
        expiresIn: JWT_EXPIRY,
      }
    );
    await redis.redisPing();
    await redisClient.set(`${user.id}`, refreshToken);
    const userData = { id: user.id, token, refreshToken };
    res.redirect(`${FE_ADDRESS}?user=${encodeURIComponent(JSON.stringify(userData))}`);
  }
);

router.get(
  '/oauth2/redirect/facebook',
  passport.authenticate("facebook", { session: false, failureRedirect: `${FE_ADDRESS}`, failureMessage: true }),
  async (req, res) => {
    const user = req.user;
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret.secret,
      {
        expiresIn: REFRESH_EXPIRY,
      }
    );
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret.secret,
      {
        expiresIn: JWT_EXPIRY,
      }
    );
    await redis.redisPing();
    await redisClient.set(`${user.id}`, refreshToken);
    const userData = { id: user.id, token, refreshToken };
    res.redirect(`${FE_ADDRESS}?user=${encodeURIComponent(JSON.stringify(userData))}`);
  }
);

router.post(
  "/login",
  [
    async (req, res, next) => {
      const { email, password } = req.body;
      await check(email).isEmpty().run(req);
      await check(password).isEmpty(req);
      await redis.redisPing();
      const errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) {
        return res.status(404).send(CONSTANTS.error.FIELDS_EMPTY_ERROR);
      } else {
        next();
      }
    },
  ],
  (req, res, next) => {
    passport.authenticate("login", { session: false }, async (err, users, info) => {
      if (err) {
        console.error(`error ${err}`);
      }
      if (info !== undefined) {
        console.error(info.message);
        if (info.message === "bad username") {
          res.status(401).send(info.message);
        } else {
          res.status(403).send(info.message);
        }
      } else {
        req.logIn(users, async () => {
          const user = await User.findOne({
            where: {
              email: req.body.email,
            },
          });
          const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            jwtSecret.secret,
            {
              expiresIn: REFRESH_EXPIRY,
            }
          );
          const token = jwt.sign(
            { id: user.id, email: user.email },
            jwtSecret.secret,
            {
              expiresIn: JWT_EXPIRY,
            }
          );
          await redisClient.set(`${user.id}`, refreshToken);
          res.status(200).send({
            auth: true,
            token,
            message: "user found & logged in",
            refreshToken,
            id: user.id,
            email: user.email,
          });
        });
      }
    })(req, res, next);
  }
);

router.post(
  "/signup",
  [
    async (req, res, next) => {
      const { email, password } = req.body;
      await check(email).isEmpty().run(req);
      await check(password).isEmpty().run(req);
      const errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) {
        return res.status(404).send(CONSTANTS.error.FIELDS_EMPTY_ERROR);
      } else {
        next();
      }
    },
  ],
  (req, res, next) => {
    passport.authenticate("register", { session: false }, (err, user, info) => {
      if (err) {
        console.log(err);
      }
      if (info !== undefined) {
        console.error(info.message);
        res.status(403).send(info.message);
      } else {
        req.logIn(user, (error) => {
          res.status(200).send({ message: "user created", id: user.id });
        });
      }
    })(req, res, next);
  }
);

router.patch(
  "/update",
  [
    async (req, res, next) => {
      const authToken = req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER]
        ? req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER].split(" ")
        : undefined;
      await check(authToken[1]).isEmpty().run(req);
      const errors = validationResult(req);
      console.log(errors);
      if (!errors.isEmpty()) {
        return res.status(404).send("error");
      } else {
        next();
      }
    },
  ],
  verifyToken(),
  async (req, res, next) => {
    let user = await jwtAuth(req, res, next);
    if (user) {
      const userStored = await User.findOne({
        where: {
          id: user.id,
        },
      });
      let firstName = req.body.firstName;
      let lastName = req.body.lastName;
      let update = {};
      if (firstName) {
        update = { firstName };
      }
      if (lastName) {
        update.lastName = lastName;
      }
      const updatedUser = await userStored.update(update).catch(errHandler);
      let { id, email } = updatedUser;
      res.status(200).send({ ...updatedUser });
    } else {
      res.status(404).send("Cant find user");
    }
  }
);

router.patch(
  "/update/password",
  [
    async (req, res, next) => {
      const authToken = req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER]
        ? req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER].split(" ")
        : undefined;
      await check(authToken[1]).isEmpty().run(req);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(404).send("error");
      } else {
        next();
      }
    },
  ],
  verifyToken(),
  async (req, res, next) => {
    let user = await jwtAuth(req, res, next);
    if (user) {
      const userStored = await User.findOne({
        where: {
          id: user.id,
        },
      });
      let currentPassword = req.body.currentPassword;
      let newPassword = req.body.newPassword;
      let update = {};
      if (newPassword && currentPassword) {
        const compareResponse = await bcrypt.compare(currentPassword, userStored.password);
        if (compareResponse !== true) {
          return res.status(401).send({ "error": "Passwords do not match" });
        } else {
          const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
          update = { "password": hashedPassword };
          const updatedUser = await userStored.update(update).catch(errHandler);
          let { id, email } = updatedUser;
          res.status(200).send({ ...updatedUser });
        }
      }
      else {
        res.status(500).send({ "error": "Fields are empty" });
      }
    } else {
      res.status(404).send("Cant find user");
    }
  }
);

router.get("/get", verifyToken(), async (req, res, next) => {
  const user = await jwtAuth(req, res, next);
  if (user) {
    const userStored = await User.findOne({
      where: {
        id: user.id,
      }
    });
    let { id, firstName, lastName, email, role } = userStored;
    res.status(200).send({ id, firstName, lastName, email, role });
  } else {
    res.status(401);
  }
});


module.exports = router;
