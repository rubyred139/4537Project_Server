require("dotenv").config();

// freedb connection
// const mysql = require("mysql2/promise");
// const dbConfig = {
// 	host: process.env.MYSQL_HOST,
// 	port: process.env.MYSQL_PORT,
// 	user: process.env.MYSQL_USER,
// 	password: process.env.MYSQL_PASSWORD,
// 	database: process.env.MYSQL_DATABASE,
// 	multipleStatements: false,
// 	namedPlaceholders: true,
// };

// const database = mysql.createPool(dbConfig);

// mongo connection
const MongoStore = require("connect-mongo");
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret,
	},
});

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
module.exports = { database, mongoStore };
