require("dotenv").config();

//AWS RDS connection
const mysql = require("mysql2/promise");
var dbConfig = {
	host: process.env.RDS_HOSTNAME,
	user: process.env.RDS_USERNAME,
	password: process.env.RDS_PASSWORD,
	database: process.env.RDS_DATABASE,
	port: 3306,
	multipleStatements: false,
	namedPlaceholders: true,
};

var database = mysql.createPool(dbConfig);
module.exports = { database };
