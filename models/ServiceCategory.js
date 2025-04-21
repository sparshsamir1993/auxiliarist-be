'use strict';

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ServiceCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            ServiceCategory.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }
    }
    ServiceCategory.init({
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        userId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ServiceCategory',
    });
    return ServiceCategory;
}