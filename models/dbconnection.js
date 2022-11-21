const dbconfig = require('../config/database');

const mysql = require('mysql2');

var createConnection  = function (options) {
	
	// create the connection to database
	const connection = mysql.createConnection(options);
	return connection;

}

var MyAppModel = createConnection({
  host     : dbconfig.connection.host,
  user     : dbconfig.connection.user,
  password : dbconfig.connection.password,
  database : dbconfig.connection.database,
});

module.exports = MyAppModel;