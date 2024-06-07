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
    password: 'Mxhalisalm011216-',
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
    const { description, jiraLink, dateIdentified, assignedTo, status, priority } = req.body;
    const query = 'INSERT INTO snags (description, jiraLink, dateIdentified, assignedTo, status, priority) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [description, jiraLink, dateIdentified, assignedTo, status, priority], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json({ id: result.insertId, ...req.body });
        }
    });
});

// API endpoint to update an existing snag
app.put('/snags/:id', (req, res) => {
    const { id } = req.params;
    const { description, jiraLink, dateIdentified, assignedTo, status, priority } = req.body;
    const query = 'UPDATE snags SET description = ?, jiraLink = ?, dateIdentified = ?, assignedTo = ?, status = ?, priority = ? WHERE id = ?';
    db.query(query, [description, jiraLink, dateIdentified, assignedTo, status, priority, id], (err, result) => {
        if (err) {
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
            res.status(500).send(err);
        } else {
            res.sendStatus(204);
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
