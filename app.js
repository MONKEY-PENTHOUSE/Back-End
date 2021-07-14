const express = require('./config/express');
const {logger} = require('./config/winston');
const models = require("./models/index.js");

const port = 3000;
express().listen(port);

models.sequelize.sync().then( () => {
    console.log(" DB 연결 성공");
    logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`); 
}).catch(err => {
    console.log("연결 실패");
    console.log(err);
})