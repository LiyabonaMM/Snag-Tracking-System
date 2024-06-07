const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mxhalisalm011216-', // Update with your actual password
    database: 'snag_tracking'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// API endpoint to get all snags
app.get('/snags', (req, res) => {
    db.query('SELECT * FROM snags', (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// API endpoint to add a new snag
app.post('/snags', (req, res) => {
    const {
        snag_details, 
        date_reported, 
        consultant_reporter_name, 
        assigned_to, 
        status, 
        date_resolved, 
        was_it_reported_before, 
        previous_date_reported, 
        previous_worker 
    } = req.body;

    // Debug log for request body
    console.log("Received data for new snag:", req.body);

    const query = `INSERT INTO snags 
        (snag_details, date_reported, consultant_reporter_name, assigned_to, status, date_resolved, was_it_reported_before, previous_date_reported, previous_worker) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [snag_details, date_reported, consultant_reporter_name, assigned_to, status, date_resolved || null, was_it_reported_before, previous_date_reported || null, previous_worker || null], (err, result) => {
        if (err) {
            console.error("Error adding new snag:", err);
            res.status(500).send(err);
        } else {
            res.json({ id: result.insertId, ...req.body });
        }
    });
});

// API endpoint to update an existing snag
app.put('/snags/:id', (req, res) => {
    const { id } = req.params;
    const {
        snag_details, 
        date_reported, 
        consultant_reporter_name, 
        assigned_to, 
        status, 
        date_resolved, 
        was_it_reported_before, 
        previous_date_reported, 
        previous_worker 
    } = req.body;

    const query = `UPDATE snags 
        SET snag_details = ?, date_reported = ?, consultant_reporter_name = ?, assigned_to = ?, status = ?, date_resolved = ?, was_it_reported_before = ?, previous_date_reported = ?, previous_worker = ? 
        WHERE id = ?`;

    db.query(query, [snag_details, date_reported, consultant_reporter_name, assigned_to, status, date_resolved || null, was_it_reported_before, previous_date_reported || null, previous_worker || null, id], (err, result) => {
        if (err) {
            console.error("Error updating snag:", err);
            res.status(500).send(err);
        } else {
            res.json({ id, ...req.body });
        }
    });
});

// API endpoint to delete a snag
app.delete('/snags/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM snags WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error deleting snag:", err);
            res.status(500).send(err);
        } else {
            res.sendStatus(204);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
