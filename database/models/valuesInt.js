const uuid = require('uuid')

module.exports = function (sequelize, Sequelize) {
  const ValuesInt = sequelize.define('ValuesInt', {
    idValue: {
      type: Sequelize.UUID,
      defaultValue: () => uuid.v4(),
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    key: {
      type: Sequelize.STRING,
      allowNull: false
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    time: {
      type: Sequelize.TIME,
      allowNull: false
    },
    value: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    visible: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    freezeTableName: true
  })

  // Class Method
  ValuesInt.associate = function (models) {
    return Promise.all([
      // models.ValuesInt.belongsTo(models.Device, {
      //   foreignKey: 'idDevice'
      // })
    ])
  }
  return ValuesInt
}
