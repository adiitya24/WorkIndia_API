const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv=require('dotenv');

const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "car_rental"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

//const token = process.env.jwt_secret;

//const token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
// import port and jwt_secret from .env file to indec.js for
// Register a user
app.post('/api/signup', (req, res) => {
  const { id, username, password, email } = req.body;
  const query = 'INSERT INTO users (id,username, password, email) VALUES (?, ?, ?, ?)';
  connection.query(query, [id, username, password, email], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error registering new user');
    } else {
      res.status(200).json({ status: "Account successfully created", status_code: 200, user_id: results.insertId });
    }
  });
});


//set fake-jwt-token with real jet-token acess_token 

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err || results.length === 0) {
      res.status(401).json({ status: "Incorrect username/password provided. Please retry", status_code: 401 });
    } else {
      res.status(200).json({ status: "Login successful", status_code: 200, user_id: results[0].id, access_token:'jwt-token' });
    }
  });
});


// Add a new car
app.post('/api/car/create', (req, res) => {
  const { category, model, number_plate, current_city, rent_per_hour } = req.body;
  const query = 'INSERT INTO cars (category, model, number_plate, current_city, rent_per_hour) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [category, model, number_plate, current_city, rent_per_hour], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error adding new car');
    } else {
      res.status(200).json({ message: "Car added successfully", car_id: results.insertId, status_code: 200 });
    }
  });
});

// Get available rides
app.get('/api/car/get-rides', (req, res) => {
  console.log('Request received', req.query);
  const { origin, destination, category, required_hours } = req.query;

  // Validate required query parameters
  if (!origin || !category || !required_hours) {
    return res.status(400).send('Missing required query parameters: origin, category, and required_hours');
  }

  const query = 'SELECT * FROM cars WHERE current_city = ? AND category = ?';
  console.log('Executing query', query, origin, category);
  connection.query(query, [origin, category], (err, results) => {
    if (err) {
      console.error('Database error', err);
      res.status(500).send('Error fetching available rides');
    } else {
      console.log('Query results', results);
      const carsWithTotalAmount = results.map(car => ({
        ...car,
        total_payable_amt: car.rent_per_hour * required_hours
      }));
      console.log('Sending response', carsWithTotalAmount);
      res.status(200).json(carsWithTotalAmount);
    }
  });
});


const PORT = process.env.PORT ||5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

