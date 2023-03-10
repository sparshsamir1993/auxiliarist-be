const redisClient = require("../services/redis-client");
module.exports = {
    redisPing: async () => {
        let ping;
        try {
            ping = await redisClient.ping();
            console.log(ping);
        } catch (err) {
            console.log(err)
        } finally {
            if (ping !== 'PONG') {
                await redisClient.connect();
            }
        }
    }
}