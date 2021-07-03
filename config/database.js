const mysql = require('mysql2/promise');
const {logger} = require('./winston');
const databaseInfo = require('./databasepwd');

const pool = mysql.createPool({
    host: 'rp.c4wybh857q9a.ap-northeast-2.rds.amazonaws.com',
    user: 'steady',
    port: 3306,
    password: databaseInfo.dbpwd,
    database: 'MP',
    dateStrings: 'date'
});

module.exports = {
    pool: pool
};
