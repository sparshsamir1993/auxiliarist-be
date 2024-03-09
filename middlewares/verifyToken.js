const jwt = require("jsonwebtoken");
const config = require("../config/jwtConfig");
const redisClient = require("../services/redis-client");
const CONSTANTS = require("../constants");
const { redisPing } = require("./redis")

module.exports = () => {
  return async (req, res, next) => {
    console.log("\n\n in verify token \n\n");
    console.log(req.originalUrl);
    await redisPing();
    console.log(req.headers);
    const auth = req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER]
      ? req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER].split(" ")
      : undefined;
    console.log(auth);
    if (auth && auth.length > 1) {
      const token = auth[1];
      // console.log("reresh token is --- " + refreshToken);
      console.log(" token is --- " + token);

      try {
        jwt.verify(token, config.secret);
        const refreshToken = req.headers[CONSTANTS.auth.REFRESH_TOKEN_HEADER];

        res.set("token", `Bearer ${token}`);
        res.set(CONSTANTS.auth.REFRESH_TOKEN_HEADER, `${refreshToken}`);
        return next();
      } catch (err) {
        console.log("\n\n\n\n EXPIRED !!! \n\n\n");

        if (err.name === "TokenExpiredError") {
          const refreshToken = req.headers[CONSTANTS.auth.REFRESH_TOKEN_HEADER];
          console.log("reresh token is --- " + refreshToken);
          console.log(" token is --- " + token);

          try {
            const decodedRT = jwt.verify(refreshToken, config.secret);
            const { id, email } = decodedRT;
            const redisRT = await redisClient.get(`${id}`);
            console.log(refreshToken)
            if (redisRT === refreshToken) {
              const newToken = jwt.sign({ id, email }, config.secret, {
                expiresIn: CONSTANTS.auth.JWT_EXPIRY,
              });
              const refreshToken = jwt.sign({ id, email }, config.secret, {
                expiresIn: CONSTANTS.auth.REFRESH_EXPIRY,
              });
              await redisClient.set(`${id}`, refreshToken);
              res.set("token", `Bearer ${newToken}`);
              res.set(CONSTANTS.auth.REFRESH_TOKEN_HEADER, `${refreshToken}`);
              req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER] = `Bearer ${newToken}`;
              req.headers[
                CONSTANTS.auth.REFRESH_TOKEN_HEADER
              ] = `${refreshToken}`;
              console.log(res.getHeaders());
              console.log("exiting middle----");
              return next();
            } else {
              console.log("token not same");
              res.status(401).send("Refresh token not same.");
            }
          } catch (err) {
            console.log(err);
            console.log("refresh too gone");
            res.status(500).send("Refresh token Invalid.");
          }
        } else {
          console.log(err);
        }
      }
    } else {
      res.status(401).send("No tokens sent");
    }
  };
};
