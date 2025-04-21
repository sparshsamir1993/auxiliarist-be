const jwt = require("jsonwebtoken");
const config = require("../config/jwtConfig");
const redisClient = require("../services/redis-client");
const CONSTANTS = require("../constants");
const { redisPing } = require("./redis")

module.exports = () => {
  return async (req, res, next) => {
    // Ping Redis to ensure connection is alive
    await redisPing();

    const auth = req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER]
      ? req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER].split(" ")
      : undefined;

    if (auth && auth.length > 1) {
      const token = auth[1];
      try {
        // Verify access token
        jwt.verify(token, config.secret);
        const refreshToken = req.headers[CONSTANTS.auth.REFRESH_TOKEN_HEADER];

        // Set tokens in response headers
        res.set("token", `Bearer ${token}`);
        res.set(CONSTANTS.auth.REFRESH_TOKEN_HEADER, `${refreshToken}`);
        return next();
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          const refreshToken = req.headers[CONSTANTS.auth.REFRESH_TOKEN_HEADER];
          try {
            // Verify refresh token
            const decodedRT = jwt.verify(refreshToken, config.secret);
            const { id, email } = decodedRT;
            const redisRT = await redisClient.get(`${id}`);

            if (redisRT === refreshToken) {
              // Generate new access and refresh tokens
              const newToken = jwt.sign({ id, email }, config.secret, {
                expiresIn: CONSTANTS.auth.JWT_EXPIRY,
              });
              const newRefreshToken = jwt.sign({ id, email }, config.secret, {
                expiresIn: CONSTANTS.auth.REFRESH_EXPIRY,
              });
              await redisClient.set(`${id}`, newRefreshToken);

              // Set new tokens in response headers and request headers
              res.set("token", `Bearer ${newToken}`);
              res.set(CONSTANTS.auth.REFRESH_TOKEN_HEADER, `${newRefreshToken}`);
              // req.headers[CONSTANTS.auth.AUTH_TOKEN_HEADER] = `Bearer ${newToken}`;
              // req.headers[CONSTANTS.auth.REFRESH_TOKEN_HEADER] = `${newRefreshToken}`;

              console.log("Access token refreshed successfully.");
              return next();
            } else {
              console.warn("Refresh token does not match stored token.");
              res.status(401).send("Refresh token not same.");
            }
          } catch (err) {
            console.warn("Invalid refresh token.", err);
            res.status(500).send("Refresh token Invalid.");
          }
        } else {
          console.warn("Token verification failed.", err);
          res.status(401).send("Invalid token.");
        }
      }
    } else {
      res.status(401).send("No tokens sent");
    }
  };
};
