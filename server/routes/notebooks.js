const express = require('express');
const db = require('../db');
const { verifyToken } = require('../auth');

const router = express.Router();

// Helper to interact with sqlite async
const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// ── GET ALL NOTEBOOKS ──
router.get('/', verifyToken, async (req, res) => {
    const { q } = req.query;
    try {
        let sql = 'SELECT * FROM notebooks WHERE user_id = ?';
        let params = [req.user.id];

        if (q) {
            sql += ' AND title LIKE ?';
            params.push(`%${q}%`);
        }

        sql += ' ORDER BY created_at DESC';

        const notebooks = await allAsync(sql, params);
        res.json(notebooks);
    } catch (err) {
        console.error('Fetch Notebooks Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── CREATE NOTEBOOK ──
router.post('/', verifyToken, async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await runAsync(
            'INSERT INTO notebooks (user_id, title) VALUES (?, ?)',
            [req.user.id, title]
        );

        res.status(201).json({
            message: 'Notebook created',
            notebook: {
                id: result.lastID,
                user_id: req.user.id,
                title,
                created_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Create Notebook Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
