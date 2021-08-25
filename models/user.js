const Sequelize = require('sequelize');
// const TrustedComms = require('twilio/lib/rest/preview/TrustedComms');

module.exports = class User extends Sequelize.Model{
  static init(sequelize){
    return super.init({
      userIdx:{
        type : Sequelize.INTEGER,
        allowNull : false,
        primaryKey:true,
        autoIncrement:true
      },
      userName:{
        type: Sequelize.TEXT,
        allowNull : false
      },
      userRoomNumber:{
        type: Sequelize.TEXT,
        allowNull : false
      },
      userPassword:{
        type: Sequelize.TEXT,
        allowNull : false
      },
      userPasswordSalt:{
        type: Sequelize.TEXT,
        allowNull : false
      },
      userEmail:{
        type: Sequelize.TEXT,
        allowNull : false
      },
      userPhone:{
        type : Sequelize.INTEGER,
        allowNull : false
      },
      userSex:{
        type : Sequelize.INTEGER,
        allowNull : false
      },
      userBirth:{
        type:Sequelize.DATE,
        allowNull : false
      },
      userDelete:{
        type : Sequelize.INTEGER,
        allowNull : false
      },
      userLoginMethod:{
        type : Sequelize.STRING,
        allowNull : false
      },
      // userCreatedAt:{
      //   type:Sequelize.DATE,
      //   allowNull : false,
      //   defaultValue : Sequelize.NOW
      // }
    },{
      sequelize,
      timestamps:true,
      modelName:'users',
      tableName:'users',
      paranoid:true,
      charset:'utf8',
      collate:'utf8_general_ci'
    })
  }
}

