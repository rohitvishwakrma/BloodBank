const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Vinay@6378',
  database: 'BloodBank'
});
connection.connect((err) => {
  if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
  }
  console.log('Connected to the database.');
});
module.exports = connection;
