const mysql = require('mysql2/promise');
const {logger} = require('./winston');
const databaseInfo = require('./databasepwd');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: databaseInfo.dbpwd,
    database: 'toy'
});

module.exports = {
    pool: pool
};
