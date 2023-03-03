const Sequelize = require("sequelize");
const config = require("./config/config.js");
let sequelize;
let env = process.env.NODE_ENV || "development";
if (env === "development") {
    sequelize = new Sequelize(
        config.development.database,
        config.development.username,
        config.development.password,
        {
            host: config.development.host,
            dialect: config.development.dialect,
            operatorsAliases: false,
        }
    );
} else if (env === "production") {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: "mysql",
            operatorsAliases: false,
        }
    );
}

module.exports = sequelize;

global.sequelize = sequelize;
