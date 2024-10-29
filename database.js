const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.mysql.railway.internal || 'localhost', 
  user: process.env.DB_USER || 'root',       
  password: process.env.DB_PASS || 'Vinay@6378',  
  database: process.env.DB_NAME || 'BloodBank'
});
connection.connect((err) => {
  if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
  }
  console.log('Connected to the database.');
});
module.exports = connection;
