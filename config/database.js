const mysql = require('mysql2/promise');
const {logger} = require('./winston');
const databaseInfo = require('./databasepwd');
const { RoomInstance } = require('twilio/lib/rest/video/v1/room');

// const pool = mysql.createPool({
//     host: 'rp.c4wybh857q9a.ap-northeast-2.rds.amazonaws.com',
//     user: 'steady',
//     port: 3306,
//     password: databaseInfo.dbpwd,
//     database: 'MP',
//     dateStrings: 'date'
// });
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'root',
    database: 'MP',
    dateStrings: 'date'
});
module.exports = {
    pool: pool
};
